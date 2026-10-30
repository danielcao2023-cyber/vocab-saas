import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, note, source] of [
  [2551, 'in the hope of doing sth.', 'hope 部分：/həʊp/', '不包含其余部分', 'hope_2'],
  [2553, 'so as to do sth.', 'so as to 部分：/səʊ æz tə/', '不包含后续动词和宾语', 'ef-upp-int-wordlist-b2.pdf'],
  [2461, "seek one's fortune", 'seek 部分：/siːk/', '不包含后续部分', 'definition/english/seek'],
] as const) {
  it(`shows source-backed partial pronunciation for ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.takeaway).toContain(note);
    expect(result.lesson.sources.some(s => s.url.includes(source))).toBe(true);
  });
}
