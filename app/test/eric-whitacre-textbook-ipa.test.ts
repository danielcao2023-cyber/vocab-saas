import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows the source pronunciation for the composer Eric Whitacre', () => {
 const word = { id: 2247, headword: 'Eric Whitacre' };
 const result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('/ˈerɪk ˈwɪtəkə(r)/');
 expect(result.lesson.pronunciation.uk).toBe('');
 expect(result.lesson.pronunciation.us).toBe('');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('name-pronunciation');
});
