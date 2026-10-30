import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('illustrates the liquid covering sense without losing prior examples', () => {
  const word = { id: 3373, headword: 'drown' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const sense = result.lesson.senses.find(s => s.id === 's3');
  expect(sense?.usageNote).toContain('酱汁放得过多');
  expect(sense?.examples.map(e => e.id)).toEqual(['s3-e1', 's3-e2', 's3-sauce-example']);
});
