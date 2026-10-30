import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('identifies the sourced Inner Mongolia reading as partial', () => {
  const word = {id: 2349, headword: 'Inner Mongolia Autonomous Region'}, result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.takeaway).toContain('Inner Mongolia 部分读作 /ˈɪnər mɒŋˈɡoʊliə/');
  expect(result.lesson.takeaway).toContain('不包含 Autonomous Region');
  expect(result.lesson.pronunciation.ipa).toBe('');
  expect(result.lesson.forms[0].ipa).toBe('');
  expect(result.lesson.sources.some(s=>s.url.includes('dictionary.com/browse/inner-mongolia'))).toBe(true);
});
