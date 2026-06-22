/**
 * exporters/claude-code.ts — Exporter for the Claude Code target.
 *
 * Writes each skill as a separate Markdown file under a target directory.
 * Claude Code discovers custom slash commands from `.claude/commands/<name>.md`
 * files, making them available as `/name` in the Claude Code interface.
 *
 * Default output directory: `.claude/commands/` (relative to cwd).
 * The directory is created automatically if it does not exist.
 *
 * Output file format: plain Markdown body — no YAML frontmatter. The name
 * and description fields are not reproduced in the output because Claude Code
 * derives the command name from the filename, not from embedded metadata.
 *
 * Reference: https://docs.anthropic.com/en/docs/claude-code/slash-commands
 *
 * Seam: to include a metadata header in Claude Code output (e.g., for
 * description), add an optional `includeHeader` flag to ClaudeCodeExportOptions
 * and prepend `<!-- description: <desc> -->` or similar before the body.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Minimal skill representation required by this exporter. */
export interface SkillForExport {
  name: string;
  body: string;
}

export interface ClaudeCodeExportOptions {
  /** Directory where per-skill `.md` files will be written. */
  outputDir: string;
}

/**
 * Write skills as individual Markdown files into a Claude Code commands
 * directory. Each file is named `<name>.md` and contains the skill body
 * with no frontmatter so Claude Code can use it as a slash command directly.
 */
export function exportToClaudeCode(
  skills: SkillForExport[],
  options: ClaudeCodeExportOptions
): void {
  mkdirSync(options.outputDir, { recursive: true });
  for (const skill of skills) {
    const filePath = join(options.outputDir, `${skill.name}.md`);
    writeFileSync(filePath, skill.body + '\n', 'utf-8');
  }
}
