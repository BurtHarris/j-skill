import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { exportToClaudeCode } from '../src/exporters/claude-code.ts';

let tmpDir: string;
let registryDir: string;
let outputDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `j-skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  registryDir = join(tmpDir, 'registry');
  outputDir = join(tmpDir, 'output');
  mkdirSync(join(registryDir, 'commands'), { recursive: true });
  mkdirSync(join(registryDir, 'skills'), { recursive: true });
  mkdirSync(outputDir, { recursive: true });
  process.env.J_SKILL_REGISTRY = registryDir;
});

afterEach(() => {
  delete process.env.J_SKILL_REGISTRY;
  rmSync(tmpDir, { recursive: true, force: true });
});

test('exportToClaudeCode: creates one .md file per skill', () => {
  exportToClaudeCode(
    [
      { name: 'concise', body: 'Keep responses short.' },
      { name: 'troubleshoot', body: 'Follow a systematic process.' },
    ],
    { outputDir }
  );
  const files = readdirSync(outputDir);
  assert.ok(files.includes('concise.md'));
  assert.ok(files.includes('troubleshoot.md'));
  assert.equal(files.length, 2);
});

test('exportToClaudeCode: file content equals skill body', () => {
  exportToClaudeCode(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputDir }
  );
  const content = readFileSync(join(outputDir, 'concise.md'), 'utf-8');
  assert.ok(content.includes('Keep responses short.'));
});

test('exportToClaudeCode: output files end with a newline', () => {
  exportToClaudeCode(
    [{ name: 'x', body: 'Content.' }],
    { outputDir }
  );
  const content = readFileSync(join(outputDir, 'x.md'), 'utf-8');
  assert.ok(content.endsWith('\n'));
});

test('exportToClaudeCode: output files contain no YAML frontmatter delimiters', () => {
  exportToClaudeCode(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputDir }
  );
  const content = readFileSync(join(outputDir, 'concise.md'), 'utf-8');
  assert.ok(!content.includes('---'));
});

test('exportToClaudeCode: creates output directory if it does not exist', () => {
  const nestedDir = join(outputDir, 'new', 'nested');
  exportToClaudeCode(
    [{ name: 'x', body: 'Content.' }],
    { outputDir: nestedDir }
  );
  assert.ok(existsSync(join(nestedDir, 'x.md')));
});

// Populate registry and verify runExport produces expected Claude Code output
test('runExport claude-code: exports all registry skills when no names given', async () => {
  writeFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  mkdirSync(join(registryDir, 'skills', 'diagnose'), { recursive: true });
  writeFileSync(
    join(registryDir, 'skills', 'diagnose', 'SKILL.md'),
    '---\nname: diagnose\ndescription: Debug methodically.\n---\nDebug steps here.\n'
  );

  const { runExport } = await import('../src/commands/export.ts');
  await runExport([], { target: 'claude-code', output: outputDir });

  assert.ok(existsSync(join(outputDir, 'concise.md')));
  assert.ok(existsSync(join(outputDir, 'diagnose.md')));
});

test('runExport claude-code: exports only named skills when names are given', async () => {
  writeFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  writeFileSync(
    join(registryDir, 'commands', 'verbose.md'),
    '---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n'
  );

  const { runExport } = await import('../src/commands/export.ts');
  await runExport(['concise'], { target: 'claude-code', output: outputDir });

  assert.ok(existsSync(join(outputDir, 'concise.md')));
  assert.ok(!existsSync(join(outputDir, 'verbose.md')));
});

test('runExport claude-code: exported file body matches registry skill body', async () => {
  writeFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );

  const { runExport } = await import('../src/commands/export.ts');
  await runExport(['concise'], { target: 'claude-code', output: outputDir });

  const content = readFileSync(join(outputDir, 'concise.md'), 'utf-8');
  assert.ok(content.includes('Keep responses short.'));
  assert.ok(!content.includes('name: concise'));
  assert.ok(!content.includes('---'));
});

test('runExport claude-code: sets exitCode=1 for unknown skill name', async () => {
  const { runExport } = await import('../src/commands/export.ts');
  const original = process.exitCode;
  process.exitCode = 0;
  await runExport(['no-such-skill'], { target: 'claude-code', output: outputDir });
  assert.equal(process.exitCode, 1);
  process.exitCode = original;
});
