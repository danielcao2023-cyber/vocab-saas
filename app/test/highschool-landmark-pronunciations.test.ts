import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
for(const [id,headword,ipa,url] of [
 [1733,'the Eiffel Tower','Eiffel Tower 部分：/ˌaɪfəl ˈtaʊə/','sidieducation.com'],
 [1747,'the Terracotta Army','/ðə ˌterəˈkɒtə ˈɑːmi/','yyld.51jiaoxi.com'],
] as const){
 it(`shows source-backed pronunciation for ${headword}`,()=>{
  const word={id,headword};const result=read(word);
  expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe(ipa);
  expect(result.lesson.forms[0].ipa).toBe(ipa);
  expect(result.lesson.sources.some(s=>s.url.includes(url))).toBe(true);
 });
}
