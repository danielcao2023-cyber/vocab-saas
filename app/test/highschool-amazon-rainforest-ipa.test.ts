import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels the dictionary-supported rainforest pronunciation as partial', () => {
  const word = { id: 1739, headword: 'the Amazon rainforest' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('rainforest 部分：/ˈreɪnfɒrɪst/');
  expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
  expect(result.lesson.takeaway).toContain('不包含 the 和 Amazon');
  expect(result.lesson.sources.some(s => s.url === 'https://www.oxfordlearnersdictionaries.com/definition/english/rainforest')).toBe(true);
});
