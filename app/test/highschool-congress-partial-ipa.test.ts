import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('labels textbook pronunciation of the Congress part only', () => {
  const word = { id: 2437, headword: "the National People's Congress" }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('Congress 部分：/ˈkɒŋɡres/');
  expect(result.lesson.takeaway).toContain('不含前面的');
  expect(result.lesson.pronunciation.sourceIds).toContain('part-pronunciation');
});
