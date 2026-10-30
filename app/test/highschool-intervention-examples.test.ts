import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('shows intervention in different contexts while retaining example IDs', () => {
  const word = { id: 3071, headword: 'intervention' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const examples = result.lesson.senses.find(s => s.id === 's1')?.examples;
  expect(examples?.map(e => e.id)).toEqual(['s1-e1', 's1-e2']);
  expect(examples?.[1].en).toContain('outbreak');
});
