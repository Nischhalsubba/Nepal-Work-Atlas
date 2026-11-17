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

test('invalid numeric measurements display Unknown rather than NaN or Infinity', async () => {
  const { formatInteger, formatPeople, formatPercent, formatNepalRupees } = await import('../src/lib/format.ts');
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.equal(formatInteger(invalid), 'Unknown');
    assert.equal(formatPeople(invalid), 'Unknown');
    assert.equal(formatPercent(invalid), 'Unknown');
    assert.equal(formatNepalRupees(invalid), 'Unknown');
  }
  assert.equal(formatNepalRupees(null), 'Unknown');
  assert.equal(formatPeople(250), '250 people');
  assert.equal(formatPercent(12.5), '12.5%');
  assert.equal(formatNepalRupees(2500), 'Rs 2,500');
});
