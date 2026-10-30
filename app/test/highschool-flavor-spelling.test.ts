import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('uses the headword spelling in the flavor sense examples and keeps the British comparison', () => {
  const word = { id: 3022, headword: 'flavor' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const examples = result.lesson.senses.find(s => s.id === 's3')?.examples;
  expect(examples?.map(e => e.id)).toEqual(['s3-e1', 's3-e2']);
  expect(examples?.every(e => e.en.includes('flavor'))).toBe(true);
  expect(result.lesson.wordFamily.some(item => item.word === 'flavour')).toBe(true);
});
