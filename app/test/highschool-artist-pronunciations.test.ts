import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
for (const [id, headword, ipa] of [
  [3479, 'Giotto di Bondone', '/ˈdʒɒtəʊ dɪ bɒnˈdɒne/'],
  [3487, 'Claude Monet', '/ˈklɔːd ˈmɒneɪ/'],
] as const) {
  it(`uses the full textbook pronunciation for ${headword}`, () => {
    const word = {id, headword}; const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect(result.lesson.pronunciation.ipa).toBe(ipa);
    expect(result.lesson.forms[0].ipa).toBe(ipa);
    expect(result.lesson.sources.some(s => s.url === 'https://book.pep.com.cn/1412001129201/')).toBe(true);
  });
}
