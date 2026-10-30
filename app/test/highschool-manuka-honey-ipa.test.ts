import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows an attested manuka honey pronunciation and notes variants', () => {
  const word = { id: 3870, headword: 'manuka honey' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('/məˈnuːkə ˈhʌni/');
  expect(result.lesson.forms[0].ipa).toBe('/məˈnuːkə ˈhʌni/');
  expect(result.lesson.pronunciation.notes.join(' ')).toMatch(/毛利语.*读音/);
  expect(result.lesson.takeaway).toMatch(/一种英语读法.*毛利语.*口音/);
  expect(result.lesson.sources.some(s => s.url.includes('dictionary.reverso.net'))).toBe(true);
});
