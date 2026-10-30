import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const cases = [
  [3127, 'the Jet Propulsion Laboratory', 'Jet Propulsion 部分读作 /dʒet prəˈpʌlʃən/', '不包含 the 和 Laboratory', 'koolearn.com/dict/wd_80796.html'],
  [2598, 'the Union of Soviet Socialist Republics', 'Soviet Union 读作 /ˈsəʊviət ˈjuːniən/', '这是简称的读音', 'thuvienso.tnut.edu.vn/bitstream/123456789/866/1/Life.pdf'],
] as const;
for (const [id, headword, partial, warning, url] of cases) {
  it(`labels sourced pronunciation scope for ${headword}`, () => {
    const word = { id, headword }, result = createLessonReader('data/lessons')(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.takeaway).toContain(partial);
    expect(result.lesson.takeaway).toContain(warning);
    expect(result.lesson.pronunciation.ipa).toBe('');
    expect(result.lesson.forms[0].ipa).toBe('');
    expect(result.lesson.sources.some(s => s.url.includes(url))).toBe(true);
  });
}
