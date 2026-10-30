import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
  [2680, 'Roderick', '/ˈrɒdərɪk/'],
  [2686, 'Portia Langham', '/ˈpɔːʃə ˈlæŋəm/'],
])('exposes the textbook pronunciation of %s %s', (id, headword, ipa) => {
  const word = { id, headword }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, '', '']);
  expect(result.lesson.pronunciation.sourceIds).toContain('textbook-pronunciation');
  expect(result.lesson.sources.find(x => x.id === 'textbook-pronunciation')?.url).toBe('https://file.xdf.cn/uploads/200306/230_200306151128gtoBw7cBguH928QO.pdf');
});
