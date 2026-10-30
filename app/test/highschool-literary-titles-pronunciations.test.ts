import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, book, excluded] of [
  [3746, 'The Crescent Moon', 'Crescent 部分：/ˈkresnt/', '1412001129201', '不包含 The 和 Moon'],
  [3751, 'Sonnets from the Portuguese', 'Portuguese 部分：/ˌpɔːtʃuˈɡiːz/', '1412001129201', '不包含 Sonnets from the'],
  [4087, 'The Communist Manifesto', 'Manifesto 部分：/ˌmænɪˈfestəʊ/', '1412001130201', '不包含 The Communist'],
] as const) {
  it(`labels the textbook's partial pronunciation for ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.takeaway).toContain(excluded);
    expect(result.lesson.sources.some(s => s.url.includes(book))).toBe(true);
  });
}
