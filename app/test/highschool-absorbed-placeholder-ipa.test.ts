import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
for(const [id,headword,placeholder] of [[2213,'absorbed in sth.','sth.'],[2214,'absorbed in sb.','sb.']] as const){
 it(`explains the placeholder and gives sourced fixed pronunciation: ${headword}`,()=>{
  const word={id,headword};const result=read(word);
  expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('固定部分：/əbˈzɔːbd ɪn/');
  expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
  expect(result.lesson.takeaway).toContain(`${placeholder} 是可替换的占位符`);
  expect(result.lesson.sources.some(s=>s.url==='https://bbspainresources.s3.eu-central-1.amazonaws.com/Advantage1_SB_AppendGal_21936_sz.pdf')).toBe(true);
 });
}
