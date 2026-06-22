/**
 * skills/resolver.ts — Skill lookup from the local registry.
 *
 * Resolves a skill name to its content using a fixed priority order:
 *   1. ~/.agents/commands/<name>.md   (command-style single-file skill)
 *   2. ~/.agents/skills/<name>/SKILL.md  (agent-skill package)
 *
 * The body returned has the YAML frontmatter block stripped so callers receive
 * only the Markdown content suitable for rendering or copying.
 *
 * Seam: to support aliases, resolve alias→canonical-name mapping before the
 * file-system lookup. To support project-scoped overrides, check a project
 * registry first before falling through to the user registry paths.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCommandsDir, getSkillsDir } from '../registry/paths.ts';
import { parseFrontmatter } from './frontmatter.ts';

export interface ResolvedSkill {
  name: string;
  body: string;
  path: string;
  type: 'command' | 'agent-skill';
}

export function resolveSkill(name: string): ResolvedSkill | null {
  // Resolution order: commands/ first, then skills/
  const commandPath = join(getCommandsDir(), `${name}.md`);
  if (existsSync(commandPath)) {
    const content = readFileSync(commandPath, 'utf-8');
    const { body } = parseFrontmatter(content);
    return { name, body, path: commandPath, type: 'command' };
  }

  const skillPath = join(getSkillsDir(), name, 'SKILL.md');
  if (existsSync(skillPath)) {
    const content = readFileSync(skillPath, 'utf-8');
    const { body } = parseFrontmatter(content);
    return { name, body, path: skillPath, type: 'agent-skill' };
  }

  return null;
}
