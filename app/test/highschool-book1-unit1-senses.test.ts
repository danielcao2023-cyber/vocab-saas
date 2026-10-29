import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('includes the textbook intransitive forward movement of advance', () => {
  const word = { id: 1663, headword: 'advance' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1663.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.id === 's2');
  expect(sense?.examples.some(e => e.en.includes('advanced towards') && e.zh.includes('前进'))).toBe(true);
  expect(sense?.sourceIds).toContain('advance-forward-source');
});
