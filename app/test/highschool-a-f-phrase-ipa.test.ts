import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
const examples = [
  [3002, 'be comprised of', '/bi kəmˈpraɪzd əv/'],
  [3966, 'a chorus of', '/ə ˈkɔːrəs əv/'],
] as const;
for (const [id, headword, ipa] of examples) {
  it(`shows the full sourced pronunciation for ${headword}`, () => {
    const word = { id, headword };
    const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.pronunciation.uk).toBe('');
    expect(result.lesson.pronunciation.us).toBe('');
    expect(result.lesson.sources.some(source => source.url.includes('yyld.51jiaoxi.com'))).toBe(true);
  });
}
