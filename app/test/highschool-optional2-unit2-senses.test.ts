import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('includes the textbook disclosure sense of exposure', () => {
  const word = { id: 3166, headword: 'exposure' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/3166.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('揭露'));
  expect(sense?.examples.some(e => e.en.includes('exposure of') && e.zh.includes('揭露'))).toBe(true);
  expect(sense?.sourceIds).toContain('exposure-disclosure-source');
});
