import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
const cases = [
  [2072, 'keep sb. company', '/ˌkiːp … ˈkʌmpəni/'],
  [2302, 'have sth. in common', '/ˌhæv … ɪn ˈkɒmən/'],
] as const;
for (const [id, headword, ipa] of cases) {
  it(`shows Oxford's placeholder-aware phrase pronunciation for ${headword}`, () => {
    const word = { id, headword };
    const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.pronunciation.notes.join(' ')).toMatch(/省略号.*代入/);
    expect(result.lesson.sources.some(s => s.url.includes('pocket-guide-Word-Skills.pdf'))).toBe(true);
  });
}
