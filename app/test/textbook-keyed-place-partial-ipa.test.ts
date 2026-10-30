import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
 [1, 'Rapa River', 'Rapa 部分：/ˈrɑːpɑː/', '不含 River'],
 [1, 'Portsmouth Square', 'Portsmouth 部分：/ˈpɔːtsməθ/', '不含 Square'],
])('shows textbook partial pronunciation %s %s', (id, headword, ipa, note) => {
 const word = { id, headword }, result = read(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, '', '']);
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.takeaway).toContain(note);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
});
