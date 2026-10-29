import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('teaches the textbook read-through use of go through', () => {
  const word = { id: 2078, headword: 'go through' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/2078.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('通读'));
  expect(sense?.examples.some(e => e.en.includes('go through the article') && e.zh.includes('通读'))).toBe(true);
  expect(sense?.sourceIds).toContain('go-through-reading-source');
});
