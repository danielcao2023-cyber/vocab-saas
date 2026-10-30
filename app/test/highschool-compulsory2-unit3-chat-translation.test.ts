import {expect, it} from 'vitest';
import {createLessonReader, validateLesson} from '../server/src/lessons.ts';

it('keeps the cousin unspecified in the chat example', () => {
  const identity = {id: 249, headword: 'chat'};
  const result = createLessonReader('data/lessons')(identity);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, identity).ok).toBe(true);
  const example = result.lesson.senses.flatMap(s => s.examples)
    .find(e => e.en === 'I had a nice chat with my cousin on the bus.');
  expect(example?.zh).toContain('堂亲或表亲');
  expect(example?.zh).not.toContain('表哥');
});
