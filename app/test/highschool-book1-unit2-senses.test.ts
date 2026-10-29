import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('includes the textbook visual-range sense of sight', () => {
  const word = { id: 1726, headword: 'sight' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1726.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('视线'));
  expect(sense?.examples.some(e => e.en.includes('out of sight') && e.zh.includes('视线'))).toBe(true);
  expect(sense?.sourceIds).toContain('sight-view-source');
});

it('explains the Spanish as a plural group and a singular person correctly', () => {
  const word = { id: 1743, headword: 'Spanish' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1743.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('西班牙人'));
  expect(sense?.usageNote).toContain('Spaniard');
  expect(sense?.examples.some(e => e.en.includes('the Spanish') && e.zh.includes('西班牙人'))).toBe(true);
  expect(sense?.sourceIds).toContain('spanish-people-source');
});
