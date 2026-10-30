import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('labels the sourced example pronunciation instead of reading the placeholder', () => {
  const word = { id: 3274, headword: "take sb.'s breath away" }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('例：take your breath away /teɪk jə breθ əˌweɪ/');
  expect(result.lesson.pronunciation.sourceIds).toContain('example-pronunciation');
  expect(result.lesson.takeaway).toContain('sb.');
});
