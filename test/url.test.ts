import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSource } from '../src/resolvers/url.ts';

test('parseSource: parses GitHub HTTPS URL', () => {
  const result = parseSource('https://github.com/mattpocock/skills');
  assert.deepEqual(result, {
    type: 'github-url',
    owner: 'mattpocock',
    repo: 'skills',
    originalUrl: 'https://github.com/mattpocock/skills',
  });
});

test('parseSource: parses GitHub HTTPS URL with .git suffix', () => {
  const result = parseSource('https://github.com/owner/repo.git');
  assert.ok(result?.type === 'github-url');
  assert.equal(result.owner, 'owner');
  assert.equal(result.repo, 'repo');
});

test('parseSource: rejects non-GitHub HTTPS URL', () => {
  const result = parseSource('https://example.com/owner/repo');
  assert.equal(result, null);
});

test('parseSource: parses GitHub shorthand owner/repo', () => {
  const result = parseSource('mattpocock/skills');
  assert.deepEqual(result, {
    type: 'github',
    owner: 'mattpocock',
    repo: 'skills',
  });
});

test('parseSource: parses relative local path', () => {
  const result = parseSource('./my-skills');
  assert.deepEqual(result, { type: 'local', localPath: './my-skills' });
});

test('parseSource: parses absolute local path', () => {
  const result = parseSource('/home/user/skills');
  assert.deepEqual(result, { type: 'local', localPath: '/home/user/skills' });
});

test('parseSource: parses tilde-prefixed local path', () => {
  const result = parseSource('~/my-skills');
  assert.deepEqual(result, { type: 'local', localPath: '~/my-skills' });
});

test('parseSource: returns null for unrecognized source', () => {
  const result = parseSource('not-a-valid-source!@#');
  assert.equal(result, null);
});

test('parseSource: single word is not recognized (no slash)', () => {
  const result = parseSource('someword');
  assert.equal(result, null);
});
