import assert from 'node:assert/strict';
import { Diagnostics } from '../src/diagnostics.ts';

Deno.test('Diagnostics: starts empty', () => {
  const d = new Diagnostics();
  assert.equal(d.errors.length, 0);
  assert.equal(d.warnings.length, 0);
  assert.equal(d.hasErrors(), false);
});

Deno.test('Diagnostics: records errors', () => {
  const d = new Diagnostics();
  d.error('something went wrong', 'file.md');
  assert.equal(d.errors.length, 1);
  assert.equal(d.errors[0].message, 'something went wrong');
  assert.equal(d.errors[0].file, 'file.md');
  assert.equal(d.hasErrors(), true);
});

Deno.test('Diagnostics: records warnings', () => {
  const d = new Diagnostics();
  d.warn('deprecated field');
  assert.equal(d.warnings.length, 1);
  assert.equal(d.warnings[0].severity, 'warning');
  assert.equal(d.hasErrors(), false);
});

Deno.test('Diagnostics: collects multiple errors and warnings', () => {
  const d = new Diagnostics();
  d.error('err1');
  d.error('err2');
  d.warn('warn1');
  assert.equal(d.errors.length, 2);
  assert.equal(d.warnings.length, 1);
  assert.equal(d.hasErrors(), true);
});
