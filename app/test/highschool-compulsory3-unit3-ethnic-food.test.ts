import {expect, it} from 'vitest';
import {createLessonReader, validateLesson} from '../server/src/lessons.ts';

it('explains ethnic food in the textbook and retains the community meaning', () => {
  const identity = {id: 2448, headword: 'ethnic'};
  const result = createLessonReader('data/lessons')(identity);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, identity).ok).toBe(true);
  expect(result.lesson.senses.flatMap(s => s.examples).some(e => e.en.includes('ethnic food') && e.zh.includes('民族特色'))).toBe(true);
  expect(result.lesson.senses.flatMap(s => s.examples).some(e => e.en.includes('ethnic communities'))).toBe(true);
  expect(result.lesson.senses.some(s => s.usageNote.includes('视角'))).toBe(true);
});
