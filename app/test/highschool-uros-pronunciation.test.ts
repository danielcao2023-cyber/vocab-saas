import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels the Uros pronunciation as excluding the article', () => {
  const word = {id: 1746, headword: 'the Uros'};
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('Uros 部分：/ˈjuːrəʊz/');
  expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
  expect(result.lesson.takeaway).toContain('不包含前面的 the');
  expect(result.lesson.sources.some(s => s.url === 'https://book.pep.com.cn/1412001121191/')).toBe(true);
});
