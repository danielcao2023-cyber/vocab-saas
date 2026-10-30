import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa, source, visibleNote] of [
  [1738, 'the Andes Mountains', '/ði ændiːz maʊntɪnz/', 'infoask.weby.cz', ''],
  [1740, 'the Inca Empire', 'Inca 部分：/ˈɪŋ.kə/', 'dictionary.cambridge.org', '不包含'],
  [2177, 'the Normans', 'Normans 部分：/ˈnɔːmənz/', 'etouchstone.si', '不包含'],
] as const) {
  it(`shows the supported pronunciation for ${headword}`, () => {
    const word = { id, headword };
    const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.sources.some(s => s.url.includes(source))).toBe(true);
    if (visibleNote) expect(result.lesson.takeaway).toContain(visibleNote);
  });
}
