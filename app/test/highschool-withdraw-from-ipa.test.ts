import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('retains the sourced American pronunciation of withdraw from', () => {
  const word = { id: 3920, headword: 'withdraw from' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/wɪðˈdrɔː frəm/', '', '/wɪðˈdrɔː frəm/']);
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe('https://dict.youdao.com/w/eng/withdraw_from/');
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
