import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels the astronaut’s sourced US name reading and identifies variants', () => {
  const word = { id: 2599, headword: 'Yuri Gagarin' }, result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('/ˈjuri ɡɑːˈɡɑːrɪn/');
  expect(result.lesson.forms[0].ipa).toBe('/ˈjuri ɡɑːˈɡɑːrɪn/');
  expect(result.lesson.takeaway).toMatch(/美式.*俄语.*不同/);
  expect(result.lesson.sources.some(s => s.url.includes('collinsdictionary.com/dictionary/english/gagarin'))).toBe(true);
});
