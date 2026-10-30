import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('provides a sourced concrete example of on a … basis', () => {
  const word = { id: 3777, headword: 'on a ... basis' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('例：on a regular basis /ɒn ə ˌregjələ ˈbeɪsɪs/');
  expect(result.lesson.pronunciation.sourceIds).toContain('example-pronunciation');
  expect(result.lesson.takeaway).toContain('省略号');
});
