import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('explains unclear as well as misty weather and keeps existing examples', () => {
  const word = { id: 3309, headword: 'misty' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const sense = result.lesson.senses.find(s => s.id === 's1');
  expect(sense?.meaning).toContain('记忆等不清晰');
  expect(sense?.examples.map(e => e.id)).toEqual(['s1-e1', 's1-e2', 's1-unclear-example']);
});
