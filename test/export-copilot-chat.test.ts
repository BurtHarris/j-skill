import assert from 'node:assert/strict';
import { join } from 'node:path';
import { exportToCopilotChat } from '../src/exporters/copilot-chat.ts';

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

Deno.test('exportToCopilotChat: writes a single skill as a ## section', withRegistry(({ outputDir }) => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputPath }
  );
  const content = Deno.readTextFileSync(outputPath);
  assert.ok(content.includes('## concise'));
  assert.ok(content.includes('Keep responses short.'));
}));

Deno.test('exportToCopilotChat: writes multiple skills as separate ## sections', withRegistry(({ outputDir }) => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [
      { name: 'concise', body: 'Keep responses short.' },
      { name: 'troubleshoot', body: 'Follow a systematic process.' },
    ],
    { outputPath }
  );
  const content = Deno.readTextFileSync(outputPath);
  assert.ok(content.includes('## concise'));
  assert.ok(content.includes('Keep responses short.'));
  assert.ok(content.includes('## troubleshoot'));
  assert.ok(content.includes('Follow a systematic process.'));
}));

Deno.test('exportToCopilotChat: sections are separated by blank lines', withRegistry(({ outputDir }) => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [
      { name: 'a', body: 'Body A.' },
      { name: 'b', body: 'Body B.' },
    ],
    { outputPath }
  );
  const content = Deno.readTextFileSync(outputPath);
  assert.ok(content.includes('Body A.\n\n## b'));
}));

Deno.test('exportToCopilotChat: output file ends with a newline', withRegistry(({ outputDir }) => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat([{ name: 'x', body: 'Content.' }], { outputPath });
  const content = Deno.readTextFileSync(outputPath);
  assert.ok(content.endsWith('\n'));
}));

Deno.test('exportToCopilotChat: creates parent directory if it does not exist', withRegistry(({ outputDir }) => {
  const nestedPath = join(outputDir, 'nested', 'deep', 'copilot-instructions.md');
  exportToCopilotChat([{ name: 'x', body: 'Content.' }], { outputPath: nestedPath });
  const content = Deno.readTextFileSync(nestedPath);
  assert.ok(content.includes('## x'));
}));

Deno.test('exportToCopilotChat: output does not contain YAML frontmatter delimiters', withRegistry(({ outputDir }) => {
  const outputPath = join(outputDir, 'copilot-instructions.md');
  exportToCopilotChat(
    [{ name: 'concise', body: 'Keep responses short.' }],
    { outputPath }
  );
  const content = Deno.readTextFileSync(outputPath);
  assert.ok(!content.includes('---'));
}));

Deno.test('runExport copilot-chat: exports all registry skills when no names given', withRegistry(async ({ registryDir, outputDir }) => {
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'verbose.md'),
    '---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n'
  );

  const outputPath = join(outputDir, 'out.md');
  const { runExport } = await import('../src/commands/export.ts');
  await runExport([], { target: 'copilot-chat', output: outputPath });

  const content = Deno.readTextFileSync(outputPath);
  assert.ok(content.includes('## concise'));
  assert.ok(content.includes('## verbose'));
}));

Deno.test('runExport copilot-chat: exports only named skills when names are given', withRegistry(async ({ registryDir, outputDir }) => {
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'concise.md'),
    '---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n'
  );
  Deno.writeTextFileSync(
    join(registryDir, 'commands', 'verbose.md'),
    '---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n'
  );

  const outputPath = join(outputDir, 'out.md');
  const { runExport } = await import('../src/commands/export.ts');
  await runExport(['concise'], { target: 'copilot-chat', output: outputPath });

  const content = Deno.readTextFileSync(outputPath);
  assert.ok(content.includes('## concise'));
  assert.ok(!content.includes('## verbose'));
}));

Deno.test('runExport copilot-chat: sets exitCode=1 for unknown skill name', withRegistry(async ({ outputDir }) => {
  const { runExport } = await import('../src/commands/export.ts');
  const original = process.exitCode;
  process.exitCode = 0;
  await runExport(['no-such-skill'], { target: 'copilot-chat', output: join(outputDir, 'out.md') });
  assert.equal(process.exitCode, 1);
  process.exitCode = original;
}));

Deno.test('runExport: sets exitCode=1 for unsupported target', withRegistry(async ({ outputDir }) => {
  const { runExport } = await import('../src/commands/export.ts');
  const original = process.exitCode;
  process.exitCode = 0;
  await runExport([], { target: 'unsupported-target', output: join(outputDir, 'out.md') });
  assert.equal(process.exitCode, 1);
  process.exitCode = original;
}));
