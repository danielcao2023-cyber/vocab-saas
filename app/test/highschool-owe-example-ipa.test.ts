import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('labels a sourced concrete owe … to … example', () => {
  const word = { id: 3317, headword: 'owe sth. to sb.' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('例：I owe it to you. /aɪ əʊ ɪt tə juː/');
  expect(result.lesson.pronunciation.sourceIds).toContain('example-pronunciation');
  expect(result.lesson.takeaway).toContain('sth.');
  expect(result.lesson.takeaway).toContain('sb.');
});
