/**
 * commands/export.ts — Implementation of `j-skill export [skills...] --target <target>`.
 *
 * Exports skills from the local registry to an AI-platform-specific format.
 * Two targets are supported in this release:
 *
 *   copilot-chat  — Aggregates skills into `.github/copilot-instructions.md`
 *                   for use as GitHub Copilot project-level instructions.
 *   claude-code   — Writes each skill as `.claude/commands/<name>.md` for
 *                   use as Claude Code custom slash commands.
 *
 * Workflow:
 *   1. Validate the --target option
 *   2. Resolve the requested skills (named args) or enumerate all registry skills
 *   3. Collect ALL errors before terminating (same pattern as import)
 *   4. Delegate rendering to the appropriate exporter module
 *
 * Seam: to add a new platform target, add its identifier to SUPPORTED_TARGETS,
 * implement a module in src/exporters/, and add a dispatch branch at the bottom
 * of runExport().
 */
import { join } from "@std/path";
import { existsSync } from "@std/fs";
import { getCommandsDir, getSkillsDir } from "../registry/paths.ts";
import { parseFrontmatter } from "../skills/frontmatter.ts";
import { resolveSkill } from "../skills/resolver.ts";
import { exportToCopilotChat } from "../exporters/copilot-chat.ts";
import { exportToClaudeCode } from "../exporters/claude-code.ts";
import { Diagnostics } from "../diagnostics.ts";

/** All recognised --target values. */
const SUPPORTED_TARGETS = ["copilot-chat", "claude-code"] as const;
type ExportTarget = (typeof SUPPORTED_TARGETS)[number];

export interface ExportOptions {
  target: string;
  output?: string;
}

/**
 * Enumerate every skill currently installed in the local registry.
 * Command-style skills (commands/) are listed before agent-skill packages
 * (skills/) to match the order used by `j-skill list`.
 */
function getAllRegistrySkills(): Array<{ name: string; body: string }> {
  const result: Array<{ name: string; body: string }> = [];

  const commandsDir = getCommandsDir();
  if (existsSync(commandsDir)) {
    for (const e of Deno.readDirSync(commandsDir)) {
      if (!e.isFile || !e.name.endsWith(".md")) continue;
      const content = Deno.readTextFileSync(join(commandsDir, e.name));
      const { frontmatter, body } = parseFrontmatter(content);
      const name = (frontmatter.name as string | undefined) ??
        e.name.replace(/\.md$/, "");
      result.push({ name, body });
    }
  }

  const skillsDir = getSkillsDir();
  if (existsSync(skillsDir)) {
    for (const entry of Deno.readDirSync(skillsDir)) {
      if (!entry.isDirectory) continue;
      const skillPath = join(skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) continue;
      const content = Deno.readTextFileSync(skillPath);
      const { frontmatter, body } = parseFrontmatter(content);
      const name = (frontmatter.name as string | undefined) ?? entry.name;
      result.push({ name, body });
    }
  }

  return result;
}

/**
 * Main export action. Called by the CLI with the list of optional skill names
 * and the parsed options object containing `target` and optional `output`.
 */
export async function runExport(
  skillNames: string[],
  options: ExportOptions,
): Promise<void> {
  const diagnostics = new Diagnostics();

  // Validate --target
  if (!(SUPPORTED_TARGETS as readonly string[]).includes(options.target)) {
    diagnostics.error(
      `unknown target '${options.target}'. Supported targets: ${
        SUPPORTED_TARGETS.join(", ")
      }`,
    );
    diagnostics.report();
    Deno.exitCode = 1;
    return;
  }
  const target = options.target as ExportTarget;

  // Resolve the skill set to export
  const skills: Array<{ name: string; body: string }> = [];

  if (skillNames.length > 0) {
    // Named skills: look each one up; accumulate all missing-skill errors
    for (const name of skillNames) {
      const resolved = resolveSkill(name);
      if (!resolved) {
        diagnostics.error(`skill '${name}' not found in registry`);
        continue;
      }
      skills.push({ name: resolved.name, body: resolved.body });
    }
  } else {
    // No names given: export everything currently in the registry
    skills.push(...getAllRegistrySkills());
  }

  diagnostics.report();
  if (diagnostics.hasErrors()) {
    Deno.exitCode = 1;
    return;
  }

  if (skills.length === 0) {
    console.error(
      "no skills to export. Run `j-skill import <source>` to add skills first.",
    );
    Deno.exitCode = 1;
    return;
  }

  // Dispatch to the appropriate exporter
  if (target === "copilot-chat") {
    const outputPath = options.output ??
      join(Deno.cwd(), ".github", "copilot-instructions.md");
    exportToCopilotChat(skills, { outputPath });
    console.log(
      `exported ${skills.length} skill(s) to ${outputPath} (copilot-chat)`,
    );
  } else if (target === "claude-code") {
    const outputDir = options.output ??
      join(Deno.cwd(), ".claude", "commands");
    exportToClaudeCode(skills, { outputDir });
    console.log(
      `exported ${skills.length} skill(s) to ${outputDir} (claude-code)`,
    );
    for (const skill of skills) {
      console.log(`  - ${skill.name}`);
    }
  }
}
