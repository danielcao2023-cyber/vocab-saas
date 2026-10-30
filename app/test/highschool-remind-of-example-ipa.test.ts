import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([[2022, 'remind sb. of sb.'], [2023, 'remind sb. of sth.']])('labels a sourced example in %s %s', (id, headword) => {
  const word = { id, headword }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('例：remind me of /rɪˈmaɪnd mi əv/');
  expect(result.lesson.pronunciation.sourceIds).toContain('example-pronunciation');
  expect(result.lesson.takeaway).toContain('sb.');
});
