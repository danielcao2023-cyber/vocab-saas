import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
for(const [id,headword,placeholder] of [[2127,'break away from sb.','sb.'],[2128,'break away from sth.','sth.']] as const){
 it(`shows sourced fixed phrase with placeholder explained: ${headword}`,()=>{
  const word={id,headword};const result=read(word);
  expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('固定部分：/breɪk əˈweɪ frəm/');
  expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
  expect(result.lesson.takeaway).toContain(`${placeholder} 是可替换的占位符`);
  expect(result.lesson.sources.some(s=>s.url==='https://bbspainresources.s3.eu-central-1.amazonaws.com/Bridges2_SB_AppendBas_11945.pdf')).toBe(true);
 });
}
