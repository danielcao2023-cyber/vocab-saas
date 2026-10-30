import {expect, it} from 'vitest';
import {createLessonReader, validateLesson} from '../server/src/lessons.ts';

it('distinguishes the Arabic language adjective from Arab people', () => {
  const identity = {id: 1906, headword: 'Arabic'};
  const result = createLessonReader('data/lessons')(identity);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, identity).ok).toBe(true);
  const adjective = result.lesson.senses.find(s => s.id === 's2');
  expect(adjective?.meaning).toContain('阿拉伯语言');
  expect(adjective?.usageNote).toContain('Arab');
  expect(adjective?.examples.map(e => e.id)).toEqual(['s2-e1', 's2-e2']);
});
