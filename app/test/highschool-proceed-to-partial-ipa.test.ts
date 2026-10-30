import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('identifies the sourced fixed part of proceed to sth.', () => {
  const word = { id: 3306, headword: 'proceed to sth.' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('固定部分：proceed (to) /prəˈsiːd (tə)/');
  expect(result.lesson.pronunciation.sourceIds).toContain('base-pronunciation');
  expect(result.lesson.takeaway).toContain('sth.');
});
