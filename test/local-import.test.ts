import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { importFromLocal } from '../src/resolvers/local.ts';
import { Diagnostics } from '../src/diagnostics.ts';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `j-skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(tmpDir, 'registry', 'commands'), { recursive: true });
  mkdirSync(join(tmpDir, 'registry', 'skills'), { recursive: true });
  process.env.J_SKILL_REGISTRY = join(tmpDir, 'registry');
});

afterEach(() => {
  delete process.env.J_SKILL_REGISTRY;
  rmSync(tmpDir, { recursive: true, force: true });
});

function makeSkillDir(base: string): string {
  const dir = join(tmpDir, base);
  mkdirSync(join(dir, 'commands'), { recursive: true });
  mkdirSync(join(dir, 'skills'), { recursive: true });
  return dir;
}

test('importFromLocal: imports command-style skill', () => {
  const src = makeSkillDir('source');
  writeFileSync(
    join(src, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assert.ok(result);
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0].name, 'concise');
  assert.equal(result.skills[0].type, 'command');
  assert.equal(diag.hasErrors(), false);
});

test('importFromLocal: imports agent-skill package', () => {
  const src = makeSkillDir('source');
  mkdirSync(join(src, 'skills', 'diagnose'), { recursive: true });
  writeFileSync(
    join(src, 'skills', 'diagnose', 'SKILL.md'),
    '---\nname: diagnose\ndescription: Debug methodically.\n---\nFollow these steps.\n'
  );

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assert.ok(result);
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0].name, 'diagnose');
  assert.equal(result.skills[0].type, 'agent-skill');
  assert.equal(diag.hasErrors(), false);
});

test('importFromLocal: collects ALL errors before stopping', () => {
  const src = makeSkillDir('source');
  // Two invalid command files – no name or description
  writeFileSync(join(src, 'commands', 'bad1.md'), '---\nfoo: bar\n---\nContent.\n');
  writeFileSync(join(src, 'commands', 'bad2.md'), '---\nfoo: baz\n---\nContent.\n');

  const diag = new Diagnostics();
  importFromLocal(src, diag);

  // Both files should have been processed and errors collected
  assert.ok(diag.errors.length >= 2);
});

test('importFromLocal: skips files without frontmatter (warning, not error)', () => {
  const src = makeSkillDir('source');
  writeFileSync(join(src, 'commands', 'plain.md'), 'No frontmatter here.\n');

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assert.ok(result);
  assert.equal(result.skills.length, 0);
  assert.equal(diag.hasErrors(), false);
  assert.ok(diag.warnings.length > 0);
});

test('importFromLocal: errors when source does not exist', () => {
  const diag = new Diagnostics();
  const result = importFromLocal(join(tmpDir, 'nonexistent'), diag);
  assert.equal(result, null);
  assert.ok(diag.hasErrors());
});

test('importFromLocal: skill name with spaces is an error', () => {
  const src = makeSkillDir('source');
  writeFileSync(
    join(src, 'commands', 'bad.md'),
    '---\nname: bad name\ndescription: Has spaces.\n---\nContent.\n'
  );

  const diag = new Diagnostics();
  importFromLocal(src, diag);
  assert.ok(diag.errors.some(e => e.message.includes('must not contain spaces')));
});
