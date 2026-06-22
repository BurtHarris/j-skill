import assert from 'node:assert/strict';
import { join } from 'node:path';
import { importFromLocal } from '../src/resolvers/local.ts';
import { Diagnostics } from '../src/diagnostics.ts';

function withRegistry(fn: (ctx: { tmpDir: string; registryDir: string }) => void | Promise<void>): () => Promise<void> {
  return async () => {
    const tmpDir = await Deno.makeTempDir();
    const registryDir = join(tmpDir, 'registry');
    await Deno.mkdir(join(registryDir, 'commands'), { recursive: true });
    await Deno.mkdir(join(registryDir, 'skills'), { recursive: true });
    Deno.env.set('J_SKILL_REGISTRY', registryDir);
    try {
      await fn({ tmpDir, registryDir });
    } finally {
      Deno.env.delete('J_SKILL_REGISTRY');
      await Deno.remove(tmpDir, { recursive: true });
    }
  };
}

function makeSkillDir(tmpDir: string, base: string): string {
  const dir = join(tmpDir, base);
  Deno.mkdirSync(join(dir, 'commands'), { recursive: true });
  Deno.mkdirSync(join(dir, 'skills'), { recursive: true });
  return dir;
}

Deno.test('importFromLocal: imports command-style skill', withRegistry(({ tmpDir }) => {
  const src = makeSkillDir(tmpDir, 'source');
  Deno.writeTextFileSync(
    join(src, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assert.ok(result !== null);
  assert.equal(result!.skills.length, 1);
  assert.equal(result!.skills[0].name, 'concise');
  assert.equal(result!.skills[0].type, 'command');
  assert.equal(diag.hasErrors(), false);
}));

Deno.test('importFromLocal: imports agent-skill package', withRegistry(({ tmpDir }) => {
  const src = makeSkillDir(tmpDir, 'source');
  Deno.mkdirSync(join(src, 'skills', 'diagnose'), { recursive: true });
  Deno.writeTextFileSync(
    join(src, 'skills', 'diagnose', 'SKILL.md'),
    '---\nname: diagnose\ndescription: Debug methodically.\n---\nFollow these steps.\n'
  );

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assert.ok(result !== null);
  assert.equal(result!.skills.length, 1);
  assert.equal(result!.skills[0].name, 'diagnose');
  assert.equal(result!.skills[0].type, 'agent-skill');
  assert.equal(diag.hasErrors(), false);
}));

Deno.test('importFromLocal: collects ALL errors before stopping', withRegistry(({ tmpDir }) => {
  const src = makeSkillDir(tmpDir, 'source');
  Deno.writeTextFileSync(join(src, 'commands', 'bad1.md'), '---\nfoo: bar\n---\nContent.\n');
  Deno.writeTextFileSync(join(src, 'commands', 'bad2.md'), '---\nfoo: baz\n---\nContent.\n');

  const diag = new Diagnostics();
  importFromLocal(src, diag);

  assert.ok(diag.errors.length >= 2);
}));

Deno.test('importFromLocal: skips files without frontmatter (warning, not error)', withRegistry(({ tmpDir }) => {
  const src = makeSkillDir(tmpDir, 'source');
  Deno.writeTextFileSync(join(src, 'commands', 'plain.md'), 'No frontmatter here.\n');

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assert.ok(result !== null);
  assert.equal(result!.skills.length, 0);
  assert.equal(diag.hasErrors(), false);
  assert.ok(diag.warnings.length > 0);
}));

Deno.test('importFromLocal: errors when source does not exist', withRegistry(({ tmpDir }) => {
  const diag = new Diagnostics();
  const result = importFromLocal(join(tmpDir, 'nonexistent'), diag);
  assert.equal(result, null);
  assert.ok(diag.hasErrors());
}));

Deno.test('importFromLocal: skill name with spaces is an error', withRegistry(({ tmpDir }) => {
  const src = makeSkillDir(tmpDir, 'source');
  Deno.writeTextFileSync(
    join(src, 'commands', 'bad.md'),
    '---\nname: bad name\ndescription: Has spaces.\n---\nContent.\n'
  );

  const diag = new Diagnostics();
  importFromLocal(src, diag);
  assert.ok(diag.errors.some(e => e.message.includes('must not contain spaces')));
}));
