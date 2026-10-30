import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, source, note] of [
  [3492, 'Tadpoles Searching for Mother', 'Tadpoles 部分：/ˈtædpəʊls/', 'book.pep.com.cn', '不包含 Searching for Mother'],
  [3493, "The Cowboy's Flute", 'Flute 部分：/fluːt/', 'book.pep.com.cn', "不包含 The Cowboy’s"],
  [3827, 'Hugo Award', '/ˈhjuː.ɡəʊ əˌwɔːd/', 'dictionary.cambridge.org', ''],
] as const) {
  it(`uses supported pronunciation for ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.sources.some(s => s.url.includes(source))).toBe(true);
    if (note) expect(result.lesson.takeaway).toContain(note);
    if (id === 3827) expect(result.lesson.pronunciation.us).toBe('/ˈhjuː.ɡoʊ əˌwɔːrd/');
  });
}
