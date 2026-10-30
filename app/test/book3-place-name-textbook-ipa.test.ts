import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
 [2346, 'La Tomatina', '/lɑː təʊmɑːˈtiːnɑː/', false],
 [2511, 'Huangguoshu Waterfall', 'Waterfall 部分：/ˈwɔːtəfɔːl/', true],
])('shows textbook pronunciation scope for %s %s', (id, headword, ipa, partial) => {
 const word = { id, headword }, result = read(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, '', '']);
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
 if (partial) expect(result.lesson.takeaway).toContain('不含 Huangguoshu');
 else expect(result.lesson.takeaway).toContain('西班牙语原音有所不同');
});
