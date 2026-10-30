import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('retains a full sourced pronunciation of shave off', () => {
  const word = { id: 3523, headword: 'shave off' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/ʃeɪv ɒf/', '', '']);
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe('https://context.reverso.net/translation/english-french/shave%2Boff');
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
