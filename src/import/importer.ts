import fs from "node:fs/promises";
import path from "node:path";
import { ensureRegistry, relativeToRegistry, writeManifest } from '../registry.ts';
import { discoverSkills, toSkillRecord } from '../skills/discovery.ts';
import type { ImportManifest } from '../domain/types.ts';
import { resolveImportSource } from './source.ts';
import { normalizeSlashes } from '../utils/paths.ts';

export interface ImportResult {
  manifestPath: string;
  importedSkills: string[];
}

export async function importSkills(source: string, registryRoot?: string): Promise<ImportResult> {
  const resolved = await resolveImportSource(source);

  try {
    const registry = await ensureRegistry(registryRoot);
    const discovered = await discoverSkills(resolved.workingDirectory);
    const importedFiles: string[] = [];
    const skillRecords = [];

    for (const skill of discovered) {
      const destination = skill.type === 'command'
        ? path.join(registry.commands, `${skill.name}.md`)
        : path.join(registry.skills, skill.name, 'SKILL.md');

      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(skill.absolutePath, destination);
      importedFiles.push(relativeToRegistry(destination, registry.root));
      skillRecords.push(toSkillRecord(relativeToRegistry(destination, registry.root), skill));
    }

    const collectionName = inferCollectionName(resolved.sourceLabel);
    const manifest: ImportManifest = {
      schemaVersion: '0.1',
      name: collectionName,
      source: resolved.sourceLabel,
      scope: 'user',
      importedAt: new Date().toISOString(),
      files: importedFiles,
      skills: skillRecords,
      adapters: {},
    };

    const manifestPath = await writeManifest(manifest, registry.root);
    return {
      manifestPath,
      importedSkills: skillRecords.map((skill) => skill.name),
    };
  } finally {
    await resolved.cleanup();
  }
}

function inferCollectionName(sourceLabel: string): string {
  const normalized = normalizeSlashes(sourceLabel);
  const segments = normalized.split('/').filter(Boolean);
  const tail = segments.slice(-2).join('-').replace(/[^A-Za-z0-9._-]/g, '-');
  return tail.length > 0 ? tail : 'collection';
}
