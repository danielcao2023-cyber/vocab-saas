import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
 [2348, 'the Naadam Festival', 'Naadam 部分：/nɑːdəm/', '不含 the 和 Festival'],
 [2683, 'The Phantom of the Opera', 'Phantom 部分：/ˈfæntəm/', '不含标题其余部分'],
])('labels textbook part for %s %s', (id, headword, ipa, note) => {
 const word = { id, headword }, result = read(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, '', '']);
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.takeaway).toContain(note);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
});
