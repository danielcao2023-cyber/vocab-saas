import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('shows the textbook illness sense with its required with phrase', () => {
  const word = { id: 3110, headword: 'come down' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.senses.map(s => s.id)).toEqual(['s1', 's2']);
  const illness = result.lesson.senses.find(s => s.id === 's2');
  expect(illness?.usageNote).toContain('come down with');
  expect(illness?.examples.every(e => /(?:come|came|coming) down with/i.test(e.en))).toBe(true);
});
