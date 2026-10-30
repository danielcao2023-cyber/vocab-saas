import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('exposes the sourced American pronunciation of Queen Victoria', () => {
  const word = { id: 3124, headword: 'Queen Victoria' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/kwiːn vɪkˈtɔːriə/', '', '/kwiːn vɪkˈtɔːriə/']);
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe('https://dict.youdao.com/w/eng/queen_victoria/');
});
