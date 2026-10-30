import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels Voyager as the part of Voyager 1 given a textbook pronunciation', () => {
 const word = { id: 1, headword: 'Voyager 1' }, result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['Voyager 部分：/ˈvɔɪɪdʒə(r)/', '', '']);
 expect(result.lesson.takeaway).toContain('不含编号 1');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
});
