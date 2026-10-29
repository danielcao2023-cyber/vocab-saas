import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('includes the textbook need sense of the verb demand', () => {
  const word = { id: 1898, headword: 'demand' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1898.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('需要'));
  expect(sense?.examples.some(e => e.en.includes('demands') && e.zh.includes('需要'))).toBe(true);
  expect(sense?.sourceIds).toContain('demand-need-source');
});
