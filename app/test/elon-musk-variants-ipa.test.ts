import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows both sourced name readings and labels their origins', () => {
 const word = { id: 1, headword: 'Elon Musk' }, result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('教材：/ɪˈlɒn mʌsk/；人物发音参考：/ˈiːlɒn ˈmʌsk/');
 expect(result.lesson.pronunciation.uk).toBe('');
 expect(result.lesson.pronunciation.us).toBe('');
 expect(result.lesson.takeaway).toContain('教材与人物发音参考对 Elon 的重音标注不同');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toEqual(expect.arrayContaining(['textbook-ipa','name-pronunciation']));
});
