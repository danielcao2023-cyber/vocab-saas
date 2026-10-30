import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels the textbook Canton portion of Bank of Canton', () => {
 const word = { id: 2514, headword: 'Bank of Canton' }, result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['Canton 部分：/ˈkæntɒn/', '', '']);
 expect(result.lesson.takeaway).toContain('不含 Bank of');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
});
