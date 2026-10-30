import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
 [3681, 'Hubert Hudson', '/ˈhjuːbət ˈhʌdsn/', false],
 [3678, 'Thomas Orde-Lees', '/ˈtɒməs ɔːd ˈliːz/', false],
 [3680, 'Tom Crean', 'Crean 部分：/kriːn/', true],
])('shows source pronunciation for %s %s', (id, headword, ipa, partial) => {
 const word = { id, headword }, result = read(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, '', '']);
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('name-pronunciation');
 if (partial) expect(result.lesson.takeaway).toContain('不含 Tom');
});
