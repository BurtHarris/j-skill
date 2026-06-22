/**
 * resolvers/local.ts — Local directory skill importer.
 *
 * Scans a local source directory for skill files and copies them into the user
 * registry (~/.agents/). Expected source layout:
 *
 *   <sourceDir>/
 *     commands/        — *.md files (command-style skills)
 *     skills/          — subdirectories, each with a SKILL.md
 *
 * Validation errors are accumulated into the provided Diagnostics instance
 * rather than thrown immediately, so ALL problems are reported before the
 * import terminates.
 *
 * Seam: to support additional source layouts (e.g., flat directory of .md
 * files), add a new scan branch before the return statement and push results
 * into the same files/skills accumulators.
 */
import { join } from "@std/path";
import { existsSync } from "@std/fs";
import { getCommandsDir, getSkillsDir } from "../registry/paths.ts";
import { parseFrontmatter, validateFrontmatter } from "../skills/frontmatter.ts";
import { Diagnostics } from "../diagnostics.ts";
import type { SkillEntry } from "../registry/manifest.ts";

export interface LocalImportResult {
  files: string[];
  skills: SkillEntry[];
}

export function importFromLocal(
  sourceDir: string,
  diagnostics: Diagnostics,
): LocalImportResult | null {
  if (!existsSync(sourceDir)) {
    diagnostics.error(`source directory not found: ${sourceDir}`);
    return null;
  }

  const files: string[] = [];
  const skills: SkillEntry[] = [];

  // Scan commands/
  const commandsDir = join(sourceDir, "commands");
  if (existsSync(commandsDir)) {
    for (const entry of Deno.readDirSync(commandsDir)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const srcPath = join(commandsDir, entry.name);
      const content = Deno.readTextFileSync(srcPath);
      const { frontmatter, hasFrontmatter } = parseFrontmatter(content);

      if (!hasFrontmatter) {
        diagnostics.warn(`${srcPath}: no YAML frontmatter found, skipping`);
        continue;
      }

      const { errors, warnings } = validateFrontmatter(frontmatter, srcPath);
      for (const w of warnings) diagnostics.warn(w);
      if (errors.length > 0) {
        for (const e of errors) diagnostics.error(e);
        continue;
      }

      const skillName = frontmatter.name!;
      const destPath = join(getCommandsDir(), entry.name);
      Deno.mkdirSync(getCommandsDir(), { recursive: true });
      Deno.copyFileSync(srcPath, destPath);

      const relPath = `commands/${entry.name}`;
      files.push(relPath);
      skills.push({ name: skillName, type: "command", path: relPath });
    }
  }

  // Scan skills/
  const skillsDir = join(sourceDir, "skills");
  if (existsSync(skillsDir)) {
    for (const entry of Deno.readDirSync(skillsDir)) {
      if (!entry.isDirectory) continue;
      const skillMdPath = join(skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillMdPath)) {
        diagnostics.warn(
          `${join(skillsDir, entry.name)}: no SKILL.md found, skipping`,
        );
        continue;
      }

      const content = Deno.readTextFileSync(skillMdPath);
      const { frontmatter, hasFrontmatter } = parseFrontmatter(content);

      if (!hasFrontmatter) {
        diagnostics.warn(`${skillMdPath}: no YAML frontmatter found, skipping`);
        continue;
      }

      const { errors, warnings } = validateFrontmatter(frontmatter, skillMdPath);
      for (const w of warnings) diagnostics.warn(w);
      if (errors.length > 0) {
        for (const e of errors) diagnostics.error(e);
        continue;
      }

      const skillName = frontmatter.name!;
      const destDir = join(getSkillsDir(), entry.name);
      Deno.mkdirSync(destDir, { recursive: true });

      // Copy all files in the skill directory
      const skillSrcDir = join(skillsDir, entry.name);
      for (const f of Deno.readDirSync(skillSrcDir)) {
        if (!f.isFile) continue;
        Deno.copyFileSync(join(skillSrcDir, f.name), join(destDir, f.name));
        files.push(`skills/${entry.name}/${f.name}`);
      }

      const relPath = `skills/${entry.name}/SKILL.md`;
      skills.push({ name: skillName, type: "agent-skill", path: relPath });
    }
  }

  return { files, skills };
}
