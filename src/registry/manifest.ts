import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getManifestsDir } from './paths.ts';

export interface SkillEntry {
  name: string;
  type: 'command' | 'agent-skill';
  path: string;
}

export interface Manifest {
  schemaVersion: '0.1';
  name: string;
  source: string;
  scope: 'user';
  importedAt: string;
  files: string[];
  skills: SkillEntry[];
  adapters: Record<string, unknown>;
}

export function saveManifest(manifest: Manifest): string {
  const safeName = manifest.name.replace(/[/\\:*?"<>|]/g, '_');
  const filePath = join(getManifestsDir(), `${safeName}.json`);
  writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function loadManifest(name: string): Manifest | null {
  const safeName = name.replace(/[/\\:*?"<>|]/g, '_');
  const filePath = join(getManifestsDir(), `${safeName}.json`);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8')) as Manifest;
}

export function listManifests(): Manifest[] {
  const dir = getManifestsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as Manifest);
}
