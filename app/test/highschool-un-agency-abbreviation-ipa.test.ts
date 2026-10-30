import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const cases = [
  [1977, 'United Nations Educational, Scientific and Cultural Organization', '简称 UNESCO 读作 /juːˈneskəʊ/', 'oxfordlearnersdictionaries.com/definition/english/unesco'],
  [2252, "United Nations Children's Fund", '简称 UNICEF 读作 /ˈjuːnɪsef/', 'oxfordlearnersdictionaries.com/us/definition/english/unicef'],
] as const;
for (const [id, headword, partial, source] of cases) {
  it(`shows only the abbreviation pronunciation for ${headword}`, () => {
    const word = {id, headword}, result = createLessonReader('data/lessons')(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.takeaway).toContain(partial);
    expect(result.lesson.takeaway).toContain('全称音标');
    expect(result.lesson.pronunciation.ipa).toBe('');
    expect(result.lesson.forms[0].ipa).toBe('');
    expect(result.lesson.sources.some(s=>s.url.includes(source))).toBe(true);
  });
}
