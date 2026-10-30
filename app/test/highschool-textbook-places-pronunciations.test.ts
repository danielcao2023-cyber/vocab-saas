import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, book, excluded] of [
  [1734, 'Neuschwanstein Castle', 'Neuschwanstein 部分：/nɔɪˈʃvɑːnʃtaɪn/', '1412001121191', '不包含 Castle'],
  [1853, 'Sumatra Island', 'Sumatra 部分：/sʊˈmɑːtrə/', '1412001121191', '不包含 Island'],
  [1972, 'Aswan Dam', 'Aswan 部分：/ˈɑːswɒn/', '1412001122191', '不包含 Dam'],
  [1982, "Saint Basil's Cathedral", '/ˈsənt ˌbæzlz kəˈθiːdrəl/', '1412001122191', ''],
  [2347, 'Buñol', '/ˌbuːˈnɒl/', '1412001123191', ''],
] as const) {
  it(`uses the textbook pronunciation for ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    if (excluded) expect(result.lesson.takeaway).toContain(excluded);
    expect(result.lesson.sources.some(s => s.url.includes(book))).toBe(true);
  });
}
