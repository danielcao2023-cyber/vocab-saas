import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows the textbook pronunciation for the named theme park', () => {
 const word = { id: 2905, headword: 'Dollywood' }, result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/ˈdɒliˌwʊd/', '', '']);
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
});
