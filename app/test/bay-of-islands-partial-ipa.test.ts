import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels the sourced Bay of Islands name and excludes the article', () => {
 const word = { id: 3898, headword: 'the Bay of Islands' }, result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('Bay of Islands 部分：/ˈbeɪ əv ˈaɪləndz/');
 expect(result.lesson.pronunciation.uk).toBe(''); expect(result.lesson.pronunciation.us).toBe('');
 expect(result.lesson.takeaway).toContain('不含前面的 the');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('name-pronunciation');
});
