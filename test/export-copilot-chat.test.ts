import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { exportToCopilotChat } from '../src/exporters/copilot-chat.ts';

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

test('exportToCopilotChat: writes a single skill as a ## section', () => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputPath }
  );
  const content = readFileSync(outputPath, 'utf-8');
  assert.ok(content.includes('## concise'));
  assert.ok(content.includes('Keep responses short.'));
});

test('exportToCopilotChat: writes multiple skills as separate ## sections', () => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [
      { name: 'concise', body: 'Keep responses short.' },
      { name: 'troubleshoot', body: 'Follow a systematic process.' },
    ],
    { outputPath }
  );
  const content = readFileSync(outputPath, 'utf-8');
  assert.ok(content.includes('## concise'));
  assert.ok(content.includes('Keep responses short.'));
  assert.ok(content.includes('## troubleshoot'));
  assert.ok(content.includes('Follow a systematic process.'));
});

test('exportToCopilotChat: sections are separated by blank lines', () => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [
      { name: 'a', body: 'Body A.' },
      { name: 'b', body: 'Body B.' },
    ],
    { outputPath }
  );
  const content = readFileSync(outputPath, 'utf-8');
  // The two sections must be separated by at least one blank line
  assert.ok(content.includes('Body A.\n\n## b'));
});

test('exportToCopilotChat: output file ends with a newline', () => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat([{ name: 'x', body: 'Content.' }], { outputPath });
  const content = readFileSync(outputPath, 'utf-8');
  assert.ok(content.endsWith('\n'));
});

test('exportToCopilotChat: creates parent directory if it does not exist', () => {
  const nestedPath = join(outputDir, 'nested', 'deep', 'copilot-instructions.md');
  exportToCopilotChat([{ name: 'x', body: 'Content.' }], { outputPath: nestedPath });
  const content = readFileSync(nestedPath, 'utf-8');
  assert.ok(content.includes('## x'));
});

test('exportToCopilotChat: output does not contain YAML frontmatter delimiters', () => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputPath }
  );
  const content = readFileSync(outputPath, 'utf-8');
  assert.ok(!content.includes('---'));
});

// Populate registry and verify runExport produces expected output
test('runExport copilot-chat: exports all registry skills when no names given', async () => {
  // Seed registry with two skills
  writeFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  writeFileSync(
    join(registryDir, 'commands', 'verbose.md'),
    '---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n'
  );

  const outputPath = join(outputDir, 'out.md');
  const { runExport } = await import('../src/commands/export.ts');
  await runExport([], { target: 'copilot-chat', output: outputPath });

  const content = readFileSync(outputPath, 'utf-8');
  assert.ok(content.includes('## concise'));
  assert.ok(content.includes('## verbose'));
});

test('runExport copilot-chat: exports only named skills when names are given', async () => {
  writeFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  writeFileSync(
    join(registryDir, 'commands', 'verbose.md'),
    '---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n'
  );

  const outputPath = join(outputDir, 'out.md');
  const { runExport } = await import('../src/commands/export.ts');
  await runExport(['concise'], { target: 'copilot-chat', output: outputPath });

  const content = readFileSync(outputPath, 'utf-8');
  assert.ok(content.includes('## concise'));
  assert.ok(!content.includes('## verbose'));
});

test('runExport copilot-chat: sets exitCode=1 for unknown skill name', async () => {
  const { runExport } = await import('../src/commands/export.ts');
  const original = process.exitCode;
  process.exitCode = 0;
  await runExport(['no-such-skill'], { target: 'copilot-chat', output: join(outputDir, 'out.md') });
  assert.equal(process.exitCode, 1);
  process.exitCode = original;
});

test('runExport: sets exitCode=1 for unsupported target', async () => {
  const { runExport } = await import('../src/commands/export.ts');
  const original = process.exitCode;
  process.exitCode = 0;
  await runExport([], { target: 'unsupported-target', output: join(outputDir, 'out.md') });
  assert.equal(process.exitCode, 1);
  process.exitCode = original;
});
