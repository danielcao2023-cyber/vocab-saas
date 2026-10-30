import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('marks slice off as a sourced base form with a replaceable object', () => {
  const word = { id: 3216, headword: 'slice ... off' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('词典：slice off /slaɪs ɒf/');
  expect(result.lesson.pronunciation.sourceIds).toContain('base-pronunciation');
  expect(result.lesson.takeaway).toContain('省略号');
});
