import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('labels the documented USSR abbreviation and explicitly excludes the article', () => {
  const word = { id: 2597, headword: 'the USSR' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['USSR 部分：/ˌjuː es es ˈɑː(r)/ 或 /ˌjuː es es ˈɑːr/', '', '']);
  expect(result.lesson.takeaway).toContain('不含前面的 the');
  expect(result.lesson.pronunciation.sourceIds).toContain('abbreviation-pronunciation');
});
