import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
const examples = [
  [2339, 'Coming-of-Age Day', '/ˌkʌmɪŋ əv ˈeɪdʒ deɪ/', 'tanzam-dict.net'],
  [4022, 'bounce around', '/baʊns əˈraʊnd/', 'yyld.51jiaoxi.com'],
  [4028, 'a chest of drawers', '/ə tʃest əv drɔːz/', 'yyld.51jiaoxi.com'],
] as const;
for (const [id, headword, ipa, domain] of examples) {
  it(`shows the complete sourced pronunciation for ${headword}`, () => {
    const word = { id, headword };
    const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.pronunciation.uk).toBe('');
    expect(result.lesson.pronunciation.us).toBe('');
    expect(result.lesson.sources.some(source => source.url.includes(domain))).toBe(true);
  });
}
