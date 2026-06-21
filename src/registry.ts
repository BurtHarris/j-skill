import fs from "node:fs/promises";
import path from "node:path";
import type { ImportManifest, SkillRecord } from './domain/types.ts';
import { getRegistryRoot, normalizeSlashes } from './utils/paths.ts';

export interface RegistryPaths {
  root: string;
  commands: string;
  skills: string;
  manifests: string;
}

export function getRegistryPaths(root = getRegistryRoot()): RegistryPaths {
  return {
    root,
    commands: path.join(root, 'commands'),
    skills: path.join(root, 'skills'),
    manifests: path.join(root, 'manifests'),
  };
}

export async function ensureRegistry(root = getRegistryRoot()): Promise<RegistryPaths> {
  const paths = getRegistryPaths(root);
  await Promise.all([
    fs.mkdir(paths.commands, { recursive: true }),
    fs.mkdir(paths.skills, { recursive: true }),
    fs.mkdir(paths.manifests, { recursive: true }),
  ]);
  return paths;
}

export async function resolveSkill(name: string, root = getRegistryRoot()): Promise<SkillRecord | null> {
  const paths = getRegistryPaths(root);
  const commandPath = path.join(paths.commands, `${name}.md`);
  if (await exists(commandPath)) {
    return {
      name,
      type: 'command',
      path: commandPath,
      description: '',
    };
  }

  const agentPath = path.join(paths.skills, name, 'SKILL.md');
  if (await exists(agentPath)) {
    return {
      name,
      type: 'agent-skill',
      path: agentPath,
      description: '',
    };
  }

  return null;
}

export async function listSkills(root = getRegistryRoot()): Promise<SkillRecord[]> {
  const paths = getRegistryPaths(root);
  const [commandEntries, skillEntries] = await Promise.all([
    fs.readdir(paths.commands, { withFileTypes: true }).catch(() => []),
    fs.readdir(paths.skills, { withFileTypes: true }).catch(() => []),
  ]);

  const commands = commandEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => ({
      name: entry.name.slice(0, -3),
      type: 'command' as const,
      path: path.join(paths.commands, entry.name),
      description: '',
    }));

  const packages = skillEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      type: 'agent-skill' as const,
      path: path.join(paths.skills, entry.name, 'SKILL.md'),
      description: '',
    }));

  return [...commands, ...packages].sort((left, right) => left.name.localeCompare(right.name));
}

export async function writeManifest(manifest: ImportManifest, root = getRegistryRoot()): Promise<string> {
  const paths = getRegistryPaths(root);
  const manifestPath = path.join(paths.manifests, `${manifest.name}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

export function relativeToRegistry(absolutePath: string, root = getRegistryRoot()): string {
  return normalizeSlashes(path.relative(root, absolutePath));
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
