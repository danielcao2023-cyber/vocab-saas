import {expect, it} from 'vitest';
import {createLessonReader, validateLesson} from '../server/src/lessons.ts';

const read = createLessonReader('data/lessons');
it.each([
  [3943, 'murder', '谋杀某人'],
  [4063, 'handwriting', '手写'],
  [4066, 'parking', '停车空间'],
  [3452, 'humble', '使谦卑'],
  [3457, 'ink', '上墨'],
])('loads a validated lesson with a dedicated usage for %s %s', (id, headword, expected) => {
  const result = read({id, headword});
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('lesson not ready');
  expect(validateLesson(result.lesson, {id, headword}).ok).toBe(true);
  expect(result.lesson.senses.some(sense => sense.title.includes(expected) && sense.examples.length >= 2)).toBe(true);
});
