import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, validateFrontmatter } from '../src/skills/frontmatter.ts';

test('parseFrontmatter: parses name and description', () => {
  const input = `---
name: concise
description: Respond briefly and directly.
---
Keep responses short.`;
  const { frontmatter, body, hasFrontmatter } = parseFrontmatter(input);
  assert.equal(frontmatter.name, 'concise');
  assert.equal(frontmatter.description, 'Respond briefly and directly.');
  assert.equal(body, 'Keep responses short.');
  assert.equal(hasFrontmatter, true);
});

test('parseFrontmatter: parses optional fields', () => {
  const input = `---
name: concise
description: Short responses.
aliases:
  - short
tags:
  - style
targets:
  - github-copilot
---
Body.`;
  const { frontmatter } = parseFrontmatter(input);
  assert.deepEqual(frontmatter.aliases, ['short']);
  assert.deepEqual(frontmatter.tags, ['style']);
  assert.deepEqual(frontmatter.targets, ['github-copilot']);
});

test('parseFrontmatter: no frontmatter returns full content as body', () => {
  const input = 'Just some markdown content.';
  const { frontmatter, body, hasFrontmatter } = parseFrontmatter(input);
  assert.equal(hasFrontmatter, false);
  assert.equal(body, 'Just some markdown content.');
  assert.deepEqual(frontmatter, {});
});

test('parseFrontmatter: strips frontmatter from body', () => {
  const input = `---
name: test
description: A test skill.
---

## Instructions

Do the thing.`;
  const { body } = parseFrontmatter(input);
  assert.ok(!body.includes('---'));
  assert.ok(!body.includes('name: test'));
  assert.ok(body.includes('## Instructions'));
});

test('parseFrontmatter: preserves markdown body order', () => {
  const content = `---
name: analyze
description: Analyze things.
---
# Step 1
Do first.

# Step 2
Do second.`;
  const { body } = parseFrontmatter(content);
  const step1Idx = body.indexOf('Step 1');
  const step2Idx = body.indexOf('Step 2');
  assert.ok(step1Idx < step2Idx);
});

test('validateFrontmatter: valid frontmatter passes', () => {
  const { errors, warnings } = validateFrontmatter({ name: 'concise', description: 'Brief.' }, 'test.md');
  assert.equal(errors.length, 0);
  assert.equal(warnings.length, 0);
});

test('validateFrontmatter: missing name is an error', () => {
  const { errors } = validateFrontmatter({ description: 'Brief.' }, 'test.md');
  assert.ok(errors.some(e => e.includes("'name'")));
});

test('validateFrontmatter: missing description is an error', () => {
  const { errors } = validateFrontmatter({ name: 'concise' }, 'test.md');
  assert.ok(errors.some(e => e.includes("'description'")));
});

test('validateFrontmatter: name with spaces is an error', () => {
  const { errors } = validateFrontmatter({ name: 'my skill', description: 'Brief.' }, 'test.md');
  assert.ok(errors.some(e => e.includes('must not contain spaces')));
});

test('validateFrontmatter: name with underscores is valid', () => {
  const { errors } = validateFrontmatter({ name: 'troubleshoot_v2', description: 'Brief.' }, 'test.md');
  assert.equal(errors.length, 0);
});

test('validateFrontmatter: name with hyphens is valid', () => {
  const { errors } = validateFrontmatter({ name: 'concise-mode', description: 'Brief.' }, 'test.md');
  assert.equal(errors.length, 0);
});
