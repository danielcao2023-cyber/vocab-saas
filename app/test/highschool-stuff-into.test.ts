import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('covers stuffing an object into a container and retains prior examples', () => {
  const word = { id: 3214, headword: 'stuff' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const sense = result.lesson.senses.find(s => s.id === 's2');
  expect(sense?.usageNote).toContain('stuff 物品 into 容器');
  expect(sense?.examples.map(e => e.id)).toEqual(['s2-e1', 's2-e2', 's2-into-example']);
});
