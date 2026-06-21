import fs from "node:fs/promises";
import path from "node:path";
import { DiagnosticCollector, DiagnosticError } from '../domain/errors.ts';
import type { SkillRecord, SkillType } from '../domain/types.ts';
import { parseSkillFile } from './frontmatter.ts';

export interface DiscoveredSkill {
  absolutePath: string;
  relativePath: string;
  name: string;
  type: SkillType;
  description: string;
}

export async function discoverSkills(root: string): Promise<DiscoveredSkill[]> {
  const collector = new DiagnosticCollector();
  const markdownFiles = await collectMarkdownFiles(root);
  const skillFiles = markdownFiles.filter((file) => isCommandFile(root, file) || path.basename(file) === 'SKILL.md');

  if (skillFiles.length === 0) {
    collector.error('No compatible skill files were found in the import source.', root);
    collector.throwIfAnyErrors('Skill discovery failed.');
  }

  const discovered: DiscoveredSkill[] = [];

  for (const absolutePath of skillFiles) {
    const relativePath = path.relative(root, absolutePath);

    try {
      const parsed = await parseSkillFile(absolutePath);
      discovered.push({
        absolutePath,
        relativePath,
        name: parsed.frontmatter.name,
        type: path.basename(absolutePath) === 'SKILL.md' ? 'agent-skill' : 'command',
        description: parsed.frontmatter.description,
      });
    } catch (error) {
      if (error instanceof DiagnosticError) {
        for (const diagnostic of error.diagnostics) {
          collector.add(diagnostic.severity, diagnostic.message, diagnostic.location);
        }
        continue;
      }
      throw error;
    }
  }

  const seen = new Set<string>();
  for (const skill of discovered) {
    if (seen.has(skill.name)) {
      collector.error(`Duplicate skill name "${skill.name}" found in import source.`, skill.relativePath);
    } else {
      seen.add(skill.name);
    }
  }

  collector.throwIfAnyErrors('Skill discovery failed.');
  return discovered.sort((left, right) => left.name.localeCompare(right.name));
}

function isCommandFile(root: string, filePath: string): boolean {
  if (path.extname(filePath) !== '.md' || path.basename(filePath) === 'SKILL.md') {
    return false;
  }

  const relativePath = path.relative(root, filePath);
  const segments = relativePath.split(path.sep);
  return segments.includes('commands');
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }

    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectMarkdownFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(absolutePath);
    }
  }

  return results;
}

export function toSkillRecord(pathInRegistry: string, skill: DiscoveredSkill): SkillRecord {
  return {
    name: skill.name,
    type: skill.type,
    path: pathInRegistry,
    description: skill.description,
  };
}
