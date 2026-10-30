import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
const cases = [
  [2107, 'keep ... in mind', '/kiːp … ɪn ˈmaɪnd/', 'full-blast-plus-4_companion.pdf'],
  [2226, 'in addition to sb.', '/ɪn əˈdɪʃn tə …/', '56211074'],
  [2227, 'in addition to sth.', '/ɪn əˈdɪʃn tə …/', '56211074'],
] as const;
for (const [id, headword, ipa, source] of cases) {
  it(`shows a sourced pronunciation and marks the variable part for ${headword}`, () => {
    const word = { id, headword };
    const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.pronunciation.notes.join(' ')).toMatch(/省略号.*代入/);
    expect(result.lesson.sources.some(s => s.url.includes(source))).toBe(true);
  });
}
