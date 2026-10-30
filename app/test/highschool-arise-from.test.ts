import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('explains the textbook cause sense with arise from', () => {
  const word = { id: 3271, headword: 'arise' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const sense = result.lesson.senses.find(s => s.id === 's1');
  expect(sense?.usageNote).toContain('arise from');
  expect(sense?.examples.map(e => e.id)).toEqual(['s1-e1', 's1-e2', 's1-from-example']);
});
