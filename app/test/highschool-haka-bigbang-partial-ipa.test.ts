import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const cases = [
  [3899, 'the haka', 'haka 部分读作 /ˈhɑː.kə/', '不包含 the', 'dictionary.cambridge.org/us/dictionary/english/haka'],
  [3129, 'the big bang theory', 'big bang theory 部分读作 /bɪɡ bæŋ ˈθɪərɪ/', '不包含 the', 'collinsdictionary.com/dictionary/english/big-bang-theory'],
] as const;
for (const [id, headword, partial, warning, url] of cases) {
  it(`labels the sourced pronunciation as a partial reading for ${headword}`, () => {
    const word = { id, headword }, result = createLessonReader('data/lessons')(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.takeaway).toContain(partial);
    expect(result.lesson.takeaway).toContain(warning);
    expect(result.lesson.pronunciation.ipa).toBe('');
    expect(result.lesson.forms[0].ipa).toBe('');
    expect(result.lesson.sources.some(s => s.url.includes(url))).toBe(true);
  });
}
