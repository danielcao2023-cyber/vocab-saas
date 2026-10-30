import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, note] of [
  [2111, 'Jan Tchamani', 'Jan：/dʒæn/；Tchamani：/tʃæˈmæni/', '教材分别标注'],
  [2191, 'virtual choir', 'choir 部分：/ˈkwaɪə(r)/', '不包含 virtual'],
  [2254, 'John A. Logan', 'Logan 部分：/ˈləʊɡən/', '不包含 John A.'],
] as const) {
  it(`shows the supported textbook reading for ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.takeaway).toContain(note);
    expect(result.lesson.sources.some(s => s.url === 'https://book.pep.com.cn/1412001122191/')).toBe(true);
  });
}
