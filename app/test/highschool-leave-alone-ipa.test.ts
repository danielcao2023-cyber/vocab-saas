import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows the sourced pronunciation of leave ... alone and explains the variable object', () => {
  const word = { id: 1628, headword: 'leave ... alone' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('/liːv … əˈləʊn/');
  expect(result.lesson.forms[0].ipa).toBe('/liːv … əˈləʊn/');
  expect(result.lesson.pronunciation.notes.join(' ')).toMatch(/省略号.*代入/);
  expect(result.lesson.sources.some(s => s.url.includes('SK_EiM2e_starter.pdf'))).toBe(true);
});
