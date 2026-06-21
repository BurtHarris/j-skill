import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { importSkills } from '../src/import/importer.ts';
import { listSkills } from '../src/registry.ts';
import { renderSkill } from '../src/render.ts';

test('local import, list, and render flow works end to end', async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'j-skill-test-'));
  const sourceRoot = path.join(temporaryRoot, 'source');
  const registryRoot = path.join(temporaryRoot, 'registry');
  const commandPath = path.join(sourceRoot, 'commands', 'concise.md');
  const packagePath = path.join(sourceRoot, 'diagnose', 'SKILL.md');

  await fs.mkdir(path.dirname(commandPath), { recursive: true });
  await fs.mkdir(path.dirname(packagePath), { recursive: true });
  await fs.writeFile(path.join(sourceRoot, 'README.md'), '# Not a skill\n');
  await fs.writeFile(commandPath, `---
name: concise
description: Respond briefly and directly.
---
Be concise.
`);
  await fs.writeFile(packagePath, `---
name: diagnose
description: Debug systematically.
---
Reproduce first.
`);

  try {
    const result = await importSkills(sourceRoot, registryRoot);
    const skills = await listSkills(registryRoot);
    const rendered = await renderSkill('concise', false, registryRoot);

    assert.deepEqual(result.importedSkills, ['concise', 'diagnose']);
    assert.deepEqual(
      skills.map((skill) => [skill.name, skill.type]),
      [
        ['concise', 'command'],
        ['diagnose', 'agent-skill'],
      ],
    );
    assert.equal(rendered.trim(), 'Be concise.');
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});
