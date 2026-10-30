import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('explains presentation of certificates while preserving prior examples', () => {
  const word = { id: 3144, headword: 'presentation' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const sense = result.lesson.senses.find(s => s.id === 's2');
  expect(sense?.title).toContain('颁发');
  expect(sense?.examples.map(e => e.id)).toEqual(['s2-e1', 's2-e2']);
});
