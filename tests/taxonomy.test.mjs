import assert from 'node:assert/strict';
import test from 'node:test';
import { classifySector, classifyItSubsector, classifySoftwareTrack } from '../src/lib/taxonomy.ts';

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

test('hospitality positions do not get misclassified as health jobs', () => {
  assert.equal(classifySector(job('Hospitality Manager')), 'hospitality');
  assert.equal(classifySector(job('Hospital Nurse')), 'health');
  assert.equal(classifySector(job('Hospitals Operations Coordinator')), 'health');
});

test('finance keywords do not misclassify bankruptcy law jobs', () => {
  assert.equal(classifySector(job('Bank Teller')), 'finance');
  assert.equal(classifySector(job('Banking Associate')), 'finance');
  assert.equal(classifySector(job('Bankruptcy Lawyer')), 'other');
});

test('software tracks distinguish React Native, iOS and BIOS/Reactors', () => {
  assert.equal(classifySoftwareTrack(job('React Native Developer')), 'mobile');
  assert.equal(classifySoftwareTrack(job('iOS Developer')), 'mobile');
  assert.equal(classifySoftwareTrack(job('React Developer')), 'frontend');
  assert.equal(classifySoftwareTrack(job('BIOS Firmware Software Developer')), 'other-software');
  assert.equal(classifySoftwareTrack(job('Reactor Software Engineer')), 'other-software');
});

test('IT sector matches the IT acronym even at the start of titles', () => {
  assert.equal(classifySector(job('IT Specialist')), 'it-software');
  assert.equal(classifySector(job('IT Support Officer')), 'it-software');
  assert.equal(classifySector(job('Senior IT Officer')), 'it-software');
  assert.equal(classifySector(job('Literature Teacher')), 'education');
});

test('standalone UI and UX career titles belong to product design instead of Other', () => {
  for (const title of ['UI Designer', 'UX Designer', 'UX Researcher', 'Product Designer']) {
    assert.equal(classifySector(job(title)), 'it-software', title);
    assert.equal(classifyItSubsector(job(title)), 'product-ux', title);
  }
});
