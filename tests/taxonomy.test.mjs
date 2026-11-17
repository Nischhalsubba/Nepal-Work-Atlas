import assert from 'node:assert/strict';
import test from 'node:test';
import { classifySector, classifyItSubsector } from '../src/lib/taxonomy.ts';

const job = (title) => ({
  title,
  employer: '',
  industry: '',
  source: '',
  workTypes: [],
});

test('NGO names match as whole words, not parts of unrelated titles', () => {
  assert.equal(classifySector(job('Mango Farm Assistant')), 'other');
  assert.equal(classifySector(job('INGO Programme Officer')), 'ngo');
  assert.equal(classifySector(job('NGO Project Coordinator')), 'ngo');
});

test('QA matches as a title acronym, not as part of Qatar', () => {
  assert.equal(classifyItSubsector(job('Qatar Software Developer')), 'software-engineering');
  assert.equal(classifyItSubsector(job('QA Automation Engineer')), 'qa-testing');
  assert.equal(classifyItSubsector(job('Quality Assurance Engineer')), 'qa-testing');
});
