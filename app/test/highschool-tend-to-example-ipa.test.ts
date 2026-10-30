import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('labels a sourced tend to example instead of pronouncing its placeholder', () => {
  const word = { id: 2384, headword: 'tend to do sth.' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('例：tend to complain a lot /ˌtend tə kəmˈpleɪn ə lɒt/');
  expect(result.lesson.pronunciation.sourceIds).toContain('example-pronunciation');
  expect(result.lesson.takeaway).toContain('sth.');
});
