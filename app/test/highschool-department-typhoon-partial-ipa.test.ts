import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
for (const [id, headword, detail, scope, url] of [
 [2435, 'Department of Obstetrics and Gynecology', 'obstetrics and gynecology 在美式英语中读作 /ɑːbˌstet.rɪks ən ɡaɪ.nəˈkɑː.lə.dʒi/', '不包含 Department of', 'obstetrics-and-gynaecology'],
 [2610, 'Typhoon Goni', 'typhoon 单独读作 /taɪˈfuːn/', '不包含 Goni', 'typhoon'],
] as const) {
 it(`明确 ${headword} 的局部读音`, () => {
  const word={id,headword}, result=createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if(result.status!=='ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.takeaway).toContain(detail);
  expect(result.lesson.takeaway).toContain(scope);
  expect(result.lesson.pronunciation.ipa).toBe('');
  expect(result.lesson.forms[0].ipa).toBe('');
  expect(result.lesson.sources.some(s=>s.url.includes(url))).toBe(true);
 });
}
