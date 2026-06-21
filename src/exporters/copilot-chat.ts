/**
 * exporters/copilot-chat.ts — Exporter for the GitHub Copilot Chat target.
 *
 * Renders one or more skills as a single Markdown file structured for
 * GitHub Copilot's project-level instructions. Each skill becomes a named
 * `## <name>` section so Copilot can identify individual behavioral rules.
 *
 * Default output path: `.github/copilot-instructions.md` (relative to cwd).
 * The parent directory is created automatically if it does not exist.
 *
 * Reference: https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot
 *
 * Seam: to support appending to an existing instructions file rather than
 * overwriting it, add an `append` flag to CopilotChatExportOptions and use
 * appendFileSync / readFileSync + write here.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Minimal skill representation required by this exporter. */
export interface SkillForExport {
  name: string;
  body: string;
}

export interface CopilotChatExportOptions {
  /** Absolute or relative path of the output Markdown file. */
  outputPath: string;
}

/**
 * Write skills to a GitHub Copilot instructions Markdown file.
 * Each skill is emitted as a `## <name>` section followed by its body.
 * The file is written atomically (overwrite); the parent directory is
 * created if needed.
 */
export function exportToCopilotChat(
  skills: SkillForExport[],
  options: CopilotChatExportOptions
): void {
  const sections = skills.map(s => `## ${s.name}\n\n${s.body}`);
  const content = sections.join('\n\n') + '\n';

  mkdirSync(dirname(options.outputPath), { recursive: true });
  writeFileSync(options.outputPath, content, 'utf-8');
}
