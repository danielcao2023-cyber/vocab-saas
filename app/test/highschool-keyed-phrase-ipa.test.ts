import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
  ['take up a position', '/teɪk ʌp ə pəˈzɪʃən/', '', '', 'https://www.macmillan.pl/data/products/levels/materials/Repetytorium_maturalne_Poziom_rozszerzony_SB_U4.pdf'],
  ['vital sign', '/ˈvaɪtl saɪn/', '/ˈvaɪtl saɪn/', '/ˈvaɪtl saɪn/', 'https://dict.youdao.com/w/eng/vital_sign/'],
])('serves sourced full pronunciation for keyed lesson %s', (headword, ipa, uk, us, url) => {
  const word = { id: 7777, headword }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, uk, us]);
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe(url);
});
