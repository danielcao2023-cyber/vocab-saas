import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, excluded] of [
  [1921, 'keep a balance', 'balance 部分：/ˈbæləns/', '不包含 keep a'],
  [1932, 'prevent ... from', 'prevent 部分：/prɪˈvent/', '不包含省略内容和 from'],
] as const) {
  it(`labels the textbook base-word pronunciation for ${headword}`, () => {
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
