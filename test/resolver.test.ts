import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { resolveSkill } from '../src/skills/resolver.ts';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `j-skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(tmpDir, 'commands'), { recursive: true });
  mkdirSync(join(tmpDir, 'skills'), { recursive: true });
  process.env.J_SKILL_REGISTRY = tmpDir;
});

afterEach(() => {
  delete process.env.J_SKILL_REGISTRY;
  rmSync(tmpDir, { recursive: true, force: true });
});

test('resolveSkill: finds command-style skill', () => {
  writeFileSync(
    join(tmpDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep it short.\n'
  );
  const skill = resolveSkill('concise');
  assert.ok(skill);
  assert.equal(skill.name, 'concise');
  assert.equal(skill.type, 'command');
  assert.equal(skill.body, 'Keep it short.');
});

test('resolveSkill: finds agent-skill package', () => {
  mkdirSync(join(tmpDir, 'skills', 'diagnose'));
  writeFileSync(
    join(tmpDir, 'skills', 'diagnose', 'SKILL.md'),
    '---\nname: diagnose\ndescription: Debug.\n---\nDebug steps.\n'
  );
  const skill = resolveSkill('diagnose');
  assert.ok(skill);
  assert.equal(skill.name, 'diagnose');
  assert.equal(skill.type, 'agent-skill');
  assert.equal(skill.body, 'Debug steps.');
});

test('resolveSkill: command takes precedence over agent-skill', () => {
  writeFileSync(
    join(tmpDir, 'commands', 'overlap.md'),
    '---\nname: overlap\ndescription: Command version.\n---\nFrom command.\n'
  );
  mkdirSync(join(tmpDir, 'skills', 'overlap'));
  writeFileSync(
    join(tmpDir, 'skills', 'overlap', 'SKILL.md'),
    '---\nname: overlap\ndescription: Skill version.\n---\nFrom skill.\n'
  );
  const skill = resolveSkill('overlap');
  assert.ok(skill);
  assert.equal(skill.type, 'command');
  assert.equal(skill.body, 'From command.');
});

test('resolveSkill: returns null for unknown skill', () => {
  const skill = resolveSkill('unknown');
  assert.equal(skill, null);
});

test('resolveSkill: body does not contain frontmatter', () => {
  writeFileSync(
    join(tmpDir, 'commands', 'test.md'),
    '---\nname: test\ndescription: A test.\n---\n## Instructions\n\nDo the thing.\n'
  );
  const skill = resolveSkill('test');
  assert.ok(skill);
  assert.ok(!skill.body.includes('---'));
  assert.ok(!skill.body.includes('name: test'));
  assert.ok(skill.body.includes('## Instructions'));
});
