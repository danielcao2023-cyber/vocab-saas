import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('explains the textbook lava ejection sense of erupt', () => {
  const word = { id: 1826, headword: 'erupt' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1826.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('火山'));
  expect(sense?.examples.some(e => e.en.includes('erupted lava') && e.zh.includes('熔岩'))).toBe(true);
  expect(sense?.sourceIds).toContain('erupt-lava-source');
});
