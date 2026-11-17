import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAtlasHash, parseAtlasHash } from '../src/lib/atlas-url-state.ts';

test('unescaped question marks inside a filter value are preserved', () => {
  const parsed = parseAtlasHash('#vacancies/jobs?q=design?research&province=Koshi');
  assert.equal(parsed.workspace, 'vacancies');
  assert.equal(parsed.vacancyView, 'jobs');
  assert.equal(parsed.params.get('q'), 'design?research');
  assert.equal(parsed.params.get('province'), 'Koshi');
});

test('hash build/parse roundtrip keeps encoded filter values', () => {
  const params = new URLSearchParams({ q: 'UI/UX?remote', source: 'a&b' });
  const parsed = parseAtlasHash(buildAtlasHash('vacancies', 'timeline', params));
  assert.equal(parsed.workspace, 'vacancies');
  assert.equal(parsed.vacancyView, 'timeline');
  assert.equal(parsed.params.get('q'), 'UI/UX?remote');
  assert.equal(parsed.params.get('source'), 'a&b');
});
