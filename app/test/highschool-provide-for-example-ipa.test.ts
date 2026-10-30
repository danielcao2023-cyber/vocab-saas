import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('labels a sourced example of provide for rather than pronouncing its placeholder', () => {
  const word = { id: 2589, headword: 'provide for sb.' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('例：provide for their families /prəˈvaɪd fə ðeə ˈfæmliz/');
  expect(result.lesson.pronunciation.sourceIds).toContain('example-pronunciation');
  expect(result.lesson.takeaway).toContain('sb.');
});
