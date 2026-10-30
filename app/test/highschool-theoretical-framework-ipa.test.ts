import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('exposes both dictionary pronunciations for theoretical framework', () => {
  const word = { id: 3089, headword: 'theoretical framework' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const variants = '/θiːəˈrɛtɪkəl ˈfreɪmˌwɜːrk/ 或 /θɪəˈrɛtɪkəl ˈfreɪmˌwɜːk/';
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([variants, '', '']);
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe('https://dictionary.reverso.net/english-definition/theoretical%2Bframework');
});
