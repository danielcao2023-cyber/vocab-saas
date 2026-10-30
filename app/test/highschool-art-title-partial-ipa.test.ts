import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
for (const [id, headword, partial, scope, source] of [
 [3494, 'Feeling from Mountain and Water', 'feeling 单独读作 /ˈfiː.lɪŋ/', '不包含 from Mountain and Water', 'dictionary.cambridge.org/pronunciation/english/feeling'],
 [3495, 'Clearing After Snow on a Mountain Pass', 'mountain pass 单独读作 /ˈmaʊntɪn pɑːs/', '不包含标题中其他词', 'collinsdictionary.com/us/dictionary/english/mountain-pass'],
] as const) {
 it(`标明 ${headword} 的局部读音`, () => {
  const word={id,headword}, result=createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if(result.status!=='ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.takeaway).toContain(partial);
  expect(result.lesson.takeaway).toContain(scope);
  expect(result.lesson.pronunciation.ipa).toBe('');
  expect(result.lesson.forms[0].ipa).toBe('');
  expect(result.lesson.sources.some(s=>s.url.includes(source))).toBe(true);
 });
}
