import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createLessonReader, defaultLessonDir, validateLesson } from '../server/src/lessons';
it('reads the parcel noun and packing verb as distinct senses', () => {
  const word = { id: 3957, headword: 'parcel' };
  const raw = JSON.parse(readFileSync(join(defaultLessonDir, '3957.json'), 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  expect(result.lesson?.senses.map(s => s.title)).toEqual(['包裹', '把……打包']);
  expect(result.lesson?.senses[1].examples).toHaveLength(2);
});
