import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, excluded, source] of [
  [2658, 'in a ... manner', 'manner 部分：/ˈmænə(r)/', '不包含 in a 和省略内容', 'definition/english/manner'],
  [3618, 'turn sb. down', 'turn 部分：/tɜːn/', '不包含 down 和人物宾语', 'dictionary/english/turn'],
  [3811, 'have an urge to', 'urge 部分：/ɜːdʒ/', '不包含其他部分', 'definition/english/urge_2'],
  [1, 'commit oneself to', 'commit 部分：/kəˈmɪt/', '不包含 oneself 和 to', 'definition/english/commit'],
  [4010, 'relay to', 'relay 部分：/ˈriːleɪ/ 或 /rɪˈleɪ/', '不包含 to 和宾语', 'definition/english/relay1_2'],
  [4015, 'pray that', 'pray 部分：/preɪ/', '不包含 that 和从句', 'definition/english/pray_1'],
] as const) {
  it(`marks the dictionary component for ${headword}`, () => {
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
