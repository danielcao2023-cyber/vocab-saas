import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('retains the sourced British pronunciation of series of', () => {
  const word = { id: 2473, headword: 'series of' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/ˈsɪəriːz əv/', '/ˈsɪəriːz əv/', '']);
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe('https://youglish.com/pronounce/series%20of/english/uk');
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
