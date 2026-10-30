import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('exposes the textbook pronunciation of the character Reid', () => {
  const word = { id: 2684, headword: 'Reid' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/reɪd/', '', '']);
  expect(result.lesson.pronunciation.sourceIds).toContain('textbook-pronunciation');
  expect(result.lesson.takeaway).toContain('教材人物');
  expect(result.lesson.takeaway).toContain('其他同名人物');
});
