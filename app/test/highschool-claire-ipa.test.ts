import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('shows Claire’s British and American name pronunciations from Cambridge', () => {
  const word = { id: 3822, headword: 'Claire' };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.uk).toBe('/kleə(r)/');
  expect(result.lesson.pronunciation.us).toBe('/kler/');
  expect(result.lesson.sources.some(source => source.url === 'https://dictionary.cambridge.org/us/pronunciation/english/claire')).toBe(true);
});
