import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows only the textbook pronunciation for Worsley, without claiming the whole name', () => {
 const word = { id: 3679, headword: 'Frank Worsley' };
 const result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('Worsley 部分：/wɜːsli/');
 expect(result.lesson.pronunciation.uk).toBe('');
 expect(result.lesson.pronunciation.us).toBe('');
 expect(result.lesson.takeaway).toContain('不含 Frank');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('name-pronunciation');
});
