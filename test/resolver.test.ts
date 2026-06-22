import assert from 'node:assert/strict';
import { join } from 'node:path';
import { resolveSkill } from '../src/skills/resolver.ts';

function withRegistry(fn: (dir: string) => void | Promise<void>): () => Promise<void> {
  return async () => {
    const tmpDir = await Deno.makeTempDir();
    await Deno.mkdir(join(tmpDir, 'commands'), { recursive: true });
    await Deno.mkdir(join(tmpDir, 'skills'), { recursive: true });
    Deno.env.set('J_SKILL_REGISTRY', tmpDir);
    try {
      await fn(tmpDir);
    } finally {
      Deno.env.delete('J_SKILL_REGISTRY');
      await Deno.remove(tmpDir, { recursive: true });
    }
  };
}

Deno.test('resolveSkill: finds command-style skill', withRegistry((tmpDir) => {
  Deno.writeTextFileSync(
    join(tmpDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep it short.\n'
  );
  const skill = resolveSkill('concise');
  assert.ok(skill !== null);
  assert.equal(skill!.name, 'concise');
  assert.equal(skill!.type, 'command');
  assert.equal(skill!.body, 'Keep it short.');
}));

Deno.test('resolveSkill: finds agent-skill package', withRegistry((tmpDir) => {
  Deno.mkdirSync(join(tmpDir, 'skills', 'diagnose'));
  Deno.writeTextFileSync(
    join(tmpDir, 'skills', 'diagnose', 'SKILL.md'),
    '---\nname: diagnose\ndescription: Debug.\n---\nDebug steps.\n'
  );
  const skill = resolveSkill('diagnose');
  assert.ok(skill !== null);
  assert.equal(skill!.name, 'diagnose');
  assert.equal(skill!.type, 'agent-skill');
  assert.equal(skill!.body, 'Debug steps.');
}));

Deno.test('resolveSkill: command takes precedence over agent-skill', withRegistry((tmpDir) => {
  Deno.writeTextFileSync(
    join(tmpDir, 'commands', 'overlap.md'),
    '---\nname: overlap\ndescription: Command version.\n---\nFrom command.\n'
  );
  Deno.mkdirSync(join(tmpDir, 'skills', 'overlap'));
  Deno.writeTextFileSync(
    join(tmpDir, 'skills', 'overlap', 'SKILL.md'),
    '---\nname: overlap\ndescription: Skill version.\n---\nFrom skill.\n'
  );
  const skill = resolveSkill('overlap');
  assert.ok(skill !== null);
  assert.equal(skill!.type, 'command');
  assert.equal(skill!.body, 'From command.');
}));

Deno.test('resolveSkill: returns null for unknown skill', withRegistry((_tmpDir) => {
  const skill = resolveSkill('unknown');
  assert.equal(skill, null);
}));

Deno.test('resolveSkill: body does not contain frontmatter', withRegistry((tmpDir) => {
  Deno.writeTextFileSync(
    join(tmpDir, 'commands', 'test.md'),
    '---\nname: test\ndescription: A test.\n---\n## Instructions\n\nDo the thing.\n'
  );
  const skill = resolveSkill('test');
  assert.ok(skill !== null);
  assert.ok(!skill!.body.includes('---'));
  assert.ok(!skill!.body.includes('name: test'));
  assert.ok(skill!.body.includes('## Instructions'));
}));
