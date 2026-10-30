import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows the documented Lewis reading and notes the textbook discrepancy', () => {
 const word = { id: 2516, headword: 'Robert Louis Stevenson' }, result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/ˈrɒbət ˈluːɪs ˈstiːvənsən/', '', '']);
 expect(result.lesson.takeaway).toContain('本人使用 Lewis 的读法');
 expect(result.lesson.takeaway).toContain('教材另标 /ˈluːi/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toEqual(expect.arrayContaining(['name-pronunciation','personal-name-history','textbook-ipa']));
});
