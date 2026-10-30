import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, excluded, source] of [
  [1729, 'before the Common Era', 'Common Era 部分：/ˌkɒm.ən ˈɪə.rə/', '不包含 before the', 'common-era'],
  [2047, 'bird field guide', 'field guide 部分：/ˈfiːld ˌɡaɪd/', '不包含 bird', 'field-guide'],
  [2125, 'join ... to ...', 'join 部分：/dʒɔɪn/', '不包含 to 和省略内容', 'join_1'],
] as const) {
  it(`labels the dictionary-supported partial reading of ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.takeaway).toContain(excluded);
    expect(result.lesson.sources.some(s => s.url.includes(source))).toBe(true);
  });
}
