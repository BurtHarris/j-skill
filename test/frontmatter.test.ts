import test from 'node:test';
import assert from 'node:assert/strict';
import { DiagnosticError } from '../src/domain/errors.ts';
import { parseSkillText } from '../src/skills/frontmatter.ts';

test('parseSkillText strips frontmatter and preserves markdown body', () => {
  const parsed = parseSkillText(`---
name: concise
description: Respond briefly and directly.
---
# Hello

Keep it short.
`);

  assert.equal(parsed.frontmatter.name, 'concise');
  assert.equal(parsed.frontmatter.description, 'Respond briefly and directly.');
  assert.equal(parsed.body, '# Hello\n\nKeep it short.\n');
});

test('parseSkillText rejects names with spaces', () => {
  assert.throws(
    () => parseSkillText(`---
name: concise mode
description: Invalid
---
Body
`),
    (error: unknown) => error instanceof DiagnosticError
      && error.diagnostics.some((diagnostic) => diagnostic.message.includes('must not contain spaces')),
  );
});
