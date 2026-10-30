import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels the Cambridge pronunciation as a partial phrase instead of the whole entry', () => {
  const word = { id: 3408, headword: 'mouth-to-mouth rescue breathing' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.takeaway).toContain('mouth-to-mouth 部分读作 /ˌmaʊθ.təˈmaʊθ/');
  expect(result.lesson.takeaway).toContain('不包含 rescue breathing');
  expect(result.lesson.pronunciation.ipa).toBe('');
  expect(result.lesson.forms[0].ipa).toBe('');
  expect(result.lesson.sources.some(s => s.url.includes('dictionary.cambridge.org/dictionary/english/mouth-to-mouth'))).toBe(true);
});
