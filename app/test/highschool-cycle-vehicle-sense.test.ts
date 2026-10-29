import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('reads the textbook vehicle sense without replacing existing cycle senses', () => {
  const word = { id: 2869, headword: 'cycle' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.senses.map(s => s.id)).toEqual(['s1', 's2', 's3']);
  expect(result.lesson.senses.find(s => s.id === 's3')?.title).toBe('自行车；摩托车');
  expect(result.lesson.sources.find(s => s.id === 'cycle-mw')?.url).toBe('https://www.merriam-webster.com/dictionary/cycle');
});
