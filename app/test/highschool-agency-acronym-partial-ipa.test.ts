import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const cases = [
  [2602, 'National Aeronautics and Space Administration', 'NASA 读作 /ˈnæsə/', '这是简称的读音，不是英文全称的音标', 'oxfordlearnersdictionaries.com/us/definition/english/nasa'],
  [2434, 'the OB-GYN department', 'OB-GYN 部分在北美英语中可读作 /ˌɑːb ˈɡaɪn/', '不包含 the 和 department', 'oxfordlearnersdictionaries.com/definition/english/ob-gyn'],
  [3546, "People's Liberation Army", 'liberation 单独读作 /ˌlɪb.əˈreɪ.ʃən/', '仅为其中一个词的美式读音，不是全称的音标', 'dictionary.cambridge.org/us/pronunciation/english/liberation'],
] as const;
for (const [id, headword, partial, scope, source] of cases) {
  it(`标明 ${headword} 的局部读音范围`, () => {
    const word = { id, headword }, result = createLessonReader('data/lessons')(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.takeaway).toContain(partial);
    expect(result.lesson.takeaway).toContain(scope);
    expect(result.lesson.pronunciation.ipa).toBe('');
    expect(result.lesson.forms[0].ipa).toBe('');
    expect(result.lesson.sources.some(s => s.url.includes(source))).toBe(true);
  });
}
