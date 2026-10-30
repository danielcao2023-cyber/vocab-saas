import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('exposes both documented Sputnik pronunciations', () => {
  const word = { id: 2596, headword: 'Sputnik' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const both = '/ˈspʊtnɪk/ 或 /ˈspʌtnɪk/';
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([both, '', '']);
  expect(result.lesson.forms[0].ipa).toBe(both);
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe('https://www.oxfordlearnersdictionaries.com/us/definition/english/sputnik');
});
