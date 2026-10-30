import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

const read = createLessonReader('data/lessons');
it('uses the complete name pronunciation printed in the high-school textbook', () => {
  const word = { id: 1854, headword: 'Chandra Theeravit' };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('/ˈtʃɑːndrə ˈθiːrəvɪt/');
  expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
  expect(result.lesson.pronunciation.uk).toBe('');
  expect(result.lesson.pronunciation.us).toBe('');
  expect(result.lesson.sources.some(source => source.url === 'https://www.ynmdfz.net/temp/1689239595356.pdf')).toBe(true);
  expect(result.lesson.sources.some(source => source.url.includes('cdn.zizzs.com/1724290636442'))).toBe(true);
});
