import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('covers paired objects as well as twin siblings', () => {
  const word = { id: 2933, headword: 'twin' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const adjective = result.lesson.senses.find(s => s.id === 's2');
  expect(adjective?.title).toContain('成双的');
  expect(adjective?.examples.map(e => e.id)).toEqual(['s2-e1', 's2-e2', 's2-pair-example']);
});
