import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
 [2510, 'the Richmond District', 'Richmond 部分：/ˈrɪtʃmənd/'],
 [3750, 'the Victorian era', 'Victorian 部分：/vɪkˈtɔːriən/'],
])('labels a sourced name part for %s %s', (id, headword, ipa) => {
 const word = { id, headword }, result = read(word); expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe(ipa);
 expect(result.lesson.takeaway).toContain('仅为');
 expect(result.lesson.pronunciation.sourceIds).toContain('part-pronunciation');
});
