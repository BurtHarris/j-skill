/**
 * commands/list.ts — Implementation of `j-skill list`.
 *
 * Reads the user's local registry and prints all available skills grouped by
 * type: command-style skills first, then agent-skill packages. Each entry shows
 * the skill name and its one-line description from the YAML frontmatter.
 *
 * Seam: listCommandSkills() and listAgentSkills() are private helpers; expose
 * them (or a unified listSkills()) if programmatic access is needed (e.g.,
 * shell completions or a future TUI).
 */
import { join } from "@std/path";
import { existsSync } from "@std/fs";
import { getCommandsDir, getSkillsDir } from "../registry/paths.ts";
import { parseFrontmatter } from "../skills/frontmatter.ts";

interface SkillInfo {
  name: string;
  description: string;
  type: "command" | "agent-skill";
}

function listCommandSkills(): SkillInfo[] {
  const dir = getCommandsDir();
  if (!existsSync(dir)) return [];
  return [...Deno.readDirSync(dir)]
    .filter((e) => e.isFile && e.name.endsWith(".md"))
    .map((e) => {
      const content = Deno.readTextFileSync(join(dir, e.name));
      const { frontmatter } = parseFrontmatter(content);
      const name = (frontmatter.name as string | undefined) ??
        e.name.replace(/\.md$/, "");
      const description = (frontmatter.description as string | undefined) ?? "";
      return { name, description, type: "command" as const };
    });
}

function listAgentSkills(): SkillInfo[] {
  const dir = getSkillsDir();
  if (!existsSync(dir)) return [];
  return [...Deno.readDirSync(dir)]
    .filter((e) => e.isDirectory)
    .flatMap((entry) => {
      const skillPath = join(dir, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) return [];
      const content = Deno.readTextFileSync(skillPath);
      const { frontmatter } = parseFrontmatter(content);
      const name = (frontmatter.name as string | undefined) ?? entry.name;
      const description =
        (frontmatter.description as string | undefined) ?? "";
      return [{ name, description, type: "agent-skill" as const }];
    });
}

export function runList(): void {
  const commands = listCommandSkills();
  const agentSkills = listAgentSkills();
  const all = [...commands, ...agentSkills];

  if (all.length === 0) {
    console.log(
      "no skills found. Run `j-skill import <source>` to import a collection.",
    );
    return;
  }

  if (commands.length > 0) {
    console.log("Commands:");
    for (const s of commands) {
      console.log(`  ${s.name.padEnd(20)} ${s.description}`);
    }
  }

  if (agentSkills.length > 0) {
    if (commands.length > 0) console.log("");
    console.log("Agent Skills:");
    for (const s of agentSkills) {
      console.log(`  ${s.name.padEnd(20)} ${s.description}`);
    }
  }
}
