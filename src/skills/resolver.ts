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
