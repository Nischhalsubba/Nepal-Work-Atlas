import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDate } from '../src/lib/format.ts';

test('valid ISO dates preserve the intended calendar day', () => {
  assert.equal(formatDate('2024-02-29'), 'Feb 29, 2024');
  assert.equal(formatDate('2026-12-31'), 'Dec 31, 2026');
});

test('impossible dates are not silently rewritten to another month', () => {
  assert.equal(formatDate('2026-02-29'), '2026-02-29');
  assert.equal(formatDate('2026-02-31'), '2026-02-31');
  assert.equal(formatDate('2026-13-01'), '2026-13-01');
});

test('unknown and non-ISO values are represented without guessing', () => {
  assert.equal(formatDate(null), 'Unknown');
  assert.equal(formatDate(''), 'Unknown');
  assert.equal(formatDate('Not recorded'), 'Not recorded');
});
