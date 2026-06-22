import assert from 'node:assert/strict';
import { join } from 'node:path';
import { saveManifest, loadManifest, listManifests, type Manifest } from '../src/registry/manifest.ts';

const sampleManifest: Manifest = {
  schemaVersion: '0.1',
  name: 'mattpocock/skills',
  source: 'https://github.com/mattpocock/skills',
  scope: 'user',
  importedAt: '2026-06-01T00:00:00Z',
  files: ['commands/concise.md'],
  skills: [{ name: 'concise', type: 'command', path: 'commands/concise.md' }],
  adapters: {},
};

function withRegistry(fn: (dir: string) => void | Promise<void>): () => Promise<void> {
  return async () => {
    const tmpDir = await Deno.makeTempDir();
    const manifestsDir = join(tmpDir, 'manifests');
    await Deno.mkdir(manifestsDir, { recursive: true });
    Deno.env.set('J_SKILL_REGISTRY', tmpDir);
    try {
      await fn(tmpDir);
    } finally {
      Deno.env.delete('J_SKILL_REGISTRY');
      await Deno.remove(tmpDir, { recursive: true });
    }
  };
}

Deno.test('saveManifest: writes manifest to file', withRegistry(async (_dir) => {
  const filePath = saveManifest(sampleManifest);
  let exists = false;
  try { Deno.statSync(filePath); exists = true; } catch { /* not found */ }
  assert.ok(exists);
  const raw = Deno.readTextFileSync(filePath);
  const parsed = JSON.parse(raw) as Manifest;
  assert.equal(parsed.name, 'mattpocock/skills');
  assert.equal(parsed.schemaVersion, '0.1');
  assert.equal(parsed.scope, 'user');
}));

Deno.test('loadManifest: reads back what was saved', withRegistry((_dir) => {
  saveManifest(sampleManifest);
  const loaded = loadManifest('mattpocock/skills');
  assert.ok(loaded !== null);
  assert.equal(loaded!.name, 'mattpocock/skills');
  assert.deepEqual(loaded!.skills, sampleManifest.skills);
}));

Deno.test('loadManifest: returns null for missing manifest', withRegistry((_dir) => {
  const result = loadManifest('nonexistent/repo');
  assert.equal(result, null);
}));

Deno.test('listManifests: returns all saved manifests', withRegistry((_dir) => {
  saveManifest(sampleManifest);
  saveManifest({ ...sampleManifest, name: 'other/repo', source: 'https://github.com/other/repo' });
  const all = listManifests();
  assert.equal(all.length, 2);
}));

Deno.test('listManifests: returns empty array when no manifests', withRegistry(async (dir) => {
  await Deno.remove(join(dir, 'manifests'), { recursive: true });
  const all = listManifests();
  assert.equal(all.length, 0);
}));

Deno.test('saveManifest: sanitizes slashes in name for filename', withRegistry((_dir) => {
  const filePath = saveManifest(sampleManifest);
  const fileName = filePath.split('/').at(-1)!;
  assert.ok(!fileName.includes('/'));
}));
