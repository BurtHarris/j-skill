import assert from 'node:assert/strict';
import { join } from 'node:path';
import { exportToClaudeCode } from '../src/exporters/claude-code.ts';

function withRegistry(fn: (ctx: { tmpDir: string; registryDir: string; outputDir: string }) => void | Promise<void>): () => Promise<void> {
  return async () => {
    const tmpDir = await Deno.makeTempDir();
    const registryDir = join(tmpDir, 'registry');
    const outputDir = join(tmpDir, 'output');
    await Deno.mkdir(join(registryDir, 'commands'), { recursive: true });
    await Deno.mkdir(join(registryDir, 'skills'), { recursive: true });
    await Deno.mkdir(outputDir, { recursive: true });
    Deno.env.set('J_SKILL_REGISTRY', registryDir);
    try {
      await fn({ tmpDir, registryDir, outputDir });
    } finally {
      Deno.env.delete('J_SKILL_REGISTRY');
      await Deno.remove(tmpDir, { recursive: true });
    }
  };
}

function existsSync(path: string): boolean {
  try { Deno.statSync(path); return true; } catch { return false; }
}

Deno.test('exportToClaudeCode: creates one .md file per skill', withRegistry(({ outputDir }) => {
  exportToClaudeCode(
    [
      { name: 'concise', body: 'Keep responses short.' },
      { name: 'troubleshoot', body: 'Follow a systematic process.' },
    ],
    { outputDir }
  );
  const files = [...Deno.readDirSync(outputDir)].map(e => e.name);
  assert.ok(files.includes('concise.md'));
  assert.ok(files.includes('troubleshoot.md'));
  assert.equal(files.length, 2);
}));

Deno.test('exportToClaudeCode: file content equals skill body', withRegistry(({ outputDir }) => {
  exportToClaudeCode(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputDir }
  );
  const content = Deno.readTextFileSync(join(outputDir, 'concise.md'));
  assert.ok(content.includes('Keep responses short.'));
}));

Deno.test('exportToClaudeCode: output files end with a newline', withRegistry(({ outputDir }) => {
  exportToClaudeCode(
    [{ name: 'x', body: 'Content.' }],
    { outputDir }
  );
  const content = Deno.readTextFileSync(join(outputDir, 'x.md'));
  assert.ok(content.endsWith('\n'));
}));

Deno.test('exportToClaudeCode: output files contain no YAML frontmatter delimiters', withRegistry(({ outputDir }) => {
  exportToClaudeCode(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputDir }
  );
  const content = Deno.readTextFileSync(join(outputDir, 'concise.md'));
  assert.ok(!content.includes('---'));
}));

Deno.test('exportToClaudeCode: creates output directory if it does not exist', withRegistry(({ outputDir }) => {
  const nestedDir = join(outputDir, 'new', 'nested');
  exportToClaudeCode(
    [{ name: 'x', body: 'Content.' }],
    { outputDir: nestedDir }
  );
  assert.ok(existsSync(join(nestedDir, 'x.md')));
}));

Deno.test('runExport claude-code: exports all registry skills when no names given', withRegistry(async ({ registryDir, outputDir }) => {
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  await Deno.mkdir(join(registryDir, 'skills', 'diagnose'), { recursive: true });
  Deno.writeTextFileSync(
    join(registryDir, 'skills', 'diagnose', 'SKILL.md'),
    '---\nname: diagnose\ndescription: Debug methodically.\n---\nDebug steps here.\n'
  );

  const { runExport } = await import('../src/commands/export.ts');
  await runExport([], { target: 'claude-code', output: outputDir });

  assert.ok(existsSync(join(outputDir, 'concise.md')));
  assert.ok(existsSync(join(outputDir, 'diagnose.md')));
}));

Deno.test('runExport claude-code: exports only named skills when names are given', withRegistry(async ({ registryDir, outputDir }) => {
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'verbose.md'),
    '---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n'
  );

  const { runExport } = await import('../src/commands/export.ts');
  await runExport(['concise'], { target: 'claude-code', output: outputDir });

  assert.ok(existsSync(join(outputDir, 'concise.md')));
  assert.ok(!existsSync(join(outputDir, 'verbose.md')));
}));

Deno.test('runExport claude-code: exported file body matches registry skill body', withRegistry(async ({ registryDir, outputDir }) => {
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );

  const { runExport } = await import('../src/commands/export.ts');
  await runExport(['concise'], { target: 'claude-code', output: outputDir });

  const content = Deno.readTextFileSync(join(outputDir, 'concise.md'));
  assert.ok(content.includes('Keep responses short.'));
  assert.ok(!content.includes('name: concise'));
  assert.ok(!content.includes('---'));
}));

Deno.test('runExport claude-code: sets exitCode=1 for unknown skill name', withRegistry(async (_ctx) => {
  const { runExport } = await import('../src/commands/export.ts');
  const original = process.exitCode;
  process.exitCode = 0;
  await runExport(['no-such-skill'], { target: 'claude-code', output: '/tmp/test-output' });
  assert.equal(process.exitCode, 1);
  process.exitCode = original;
}));
