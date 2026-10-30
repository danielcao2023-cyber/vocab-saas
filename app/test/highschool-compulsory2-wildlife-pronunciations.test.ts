import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, excluded] of [
  [2015, 'Tibetan antelope', 'antelope 部分：/ˈæntɪləʊp/', '不包含 Tibetan'],
  [2050, 'Yangtze River dolphin', 'dolphin 部分：/ˈdɒlfɪn/', '不包含 Yangtze River'],
] as const) {
  it(`labels the textbook pronunciation of the base word in ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.takeaway).toContain(excluded);
    expect(result.lesson.sources.some(s => s.url === 'https://book.pep.com.cn/1412001122191/')).toBe(true);
  });
}
