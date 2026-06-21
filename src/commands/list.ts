import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCommandsDir, getSkillsDir } from '../registry/paths.ts';
import { parseFrontmatter } from '../skills/frontmatter.ts';

interface SkillInfo {
  name: string;
  description: string;
  type: 'command' | 'agent-skill';
}

function listCommandSkills(): SkillInfo[] {
  const dir = getCommandsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = readFileSync(join(dir, f), 'utf-8');
      const { frontmatter } = parseFrontmatter(content);
      const name = (frontmatter.name as string | undefined) ?? f.replace(/\.md$/, '');
      const description = (frontmatter.description as string | undefined) ?? '';
      return { name, description, type: 'command' as const };
    });
}

function listAgentSkills(): SkillInfo[] {
  const dir = getSkillsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(entry => {
      const skillPath = join(dir, entry.name, 'SKILL.md');
      if (!existsSync(skillPath)) return [];
      const content = readFileSync(skillPath, 'utf-8');
      const { frontmatter } = parseFrontmatter(content);
      const name = (frontmatter.name as string | undefined) ?? entry.name;
      const description = (frontmatter.description as string | undefined) ?? '';
      return [{ name, description, type: 'agent-skill' as const }];
    });
}

export function runList(): void {
  const commands = listCommandSkills();
  const agentSkills = listAgentSkills();
  const all = [...commands, ...agentSkills];

  if (all.length === 0) {
    console.log('no skills found. Run `j-skill import <source>` to import a collection.');
    return;
  }

  if (commands.length > 0) {
    console.log('Commands:');
    for (const s of commands) {
      console.log(`  ${s.name.padEnd(20)} ${s.description}`);
    }
  }

  if (agentSkills.length > 0) {
    if (commands.length > 0) console.log('');
    console.log('Agent Skills:');
    for (const s of agentSkills) {
      console.log(`  ${s.name.padEnd(20)} ${s.description}`);
    }
  }
}
