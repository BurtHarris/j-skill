import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { saveManifest, loadManifest, listManifests, type Manifest } from '../src/registry/manifest.ts';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `j-skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const manifestsDir = join(tmpDir, 'manifests');
  mkdirSync(manifestsDir, { recursive: true });
  process.env.J_SKILL_REGISTRY = tmpDir;
});

afterEach(() => {
  delete process.env.J_SKILL_REGISTRY;
  rmSync(tmpDir, { recursive: true, force: true });
});

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

test('saveManifest: writes manifest to file', () => {
  const filePath = saveManifest(sampleManifest);
  assert.ok(existsSync(filePath));
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as Manifest;
  assert.equal(parsed.name, 'mattpocock/skills');
  assert.equal(parsed.schemaVersion, '0.1');
  assert.equal(parsed.scope, 'user');
});

test('loadManifest: reads back what was saved', () => {
  saveManifest(sampleManifest);
  const loaded = loadManifest('mattpocock/skills');
  assert.ok(loaded);
  assert.equal(loaded.name, 'mattpocock/skills');
  assert.deepEqual(loaded.skills, sampleManifest.skills);
});

test('loadManifest: returns null for missing manifest', () => {
  const result = loadManifest('nonexistent/repo');
  assert.equal(result, null);
});

test('listManifests: returns all saved manifests', () => {
  saveManifest(sampleManifest);
  saveManifest({ ...sampleManifest, name: 'other/repo', source: 'https://github.com/other/repo' });
  const all = listManifests();
  assert.equal(all.length, 2);
});

test('listManifests: returns empty array when no manifests', () => {
  // Remove manifests dir to simulate a fresh registry with no manifests
  rmSync(join(tmpDir, 'manifests'), { recursive: true, force: true });
  const all = listManifests();
  assert.equal(all.length, 0);
});

test('saveManifest: sanitizes slashes in name for filename', () => {
  const filePath = saveManifest(sampleManifest);
  // The filename should not contain a real directory separator from the name
  const fileName = filePath.split('/').at(-1)!;
  assert.ok(!fileName.includes('/'));
});
