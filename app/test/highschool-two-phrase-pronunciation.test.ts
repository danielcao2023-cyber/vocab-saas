import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

const read = createLessonReader('data/lessons');
it.each([
  [3194, 'side with', '/saɪd wɪθ/', '/saɪd wɪθ/'],
  [2591, 'in closing', '/ɪn kləʊzɪŋ/', '/ɪn kloʊzɪŋ/'],
] as const)('reads the complete sourced pronunciation of %s', (id, headword, uk, us) => {
  const word = { id, headword };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([us, uk, us]);
  expect(result.lesson.pronunciation.accentNote).toContain('原词典未标重音');
  const source = result.lesson.sources.find(s => s.id === 'phrase-pronunciation');
  expect(source?.url).toBe(`https://www.spanishdict.com/pronunciation/${encodeURIComponent(headword)}`);
  expect(result.lesson.pronunciation.sourceIds).toContain('phrase-pronunciation');
});
