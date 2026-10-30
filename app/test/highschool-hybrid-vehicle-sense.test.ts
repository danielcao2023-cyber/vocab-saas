import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('covers the textbook vehicle sense and retains hybrid examples', () => {
  const word = { id: 2980, headword: 'hybrid' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.senses.map(s => s.id)).toEqual(['s1', 's2', 's3']);
  expect(result.lesson.senses.find(s => s.id === 's3')?.title).toBe('混合动力车');
  expect(result.lesson.sources.find(s => s.id === 'hybrid-cambridge')?.url).toBe('https://dictionary.cambridge.org/dictionary/learner-english/hybrid');
});
