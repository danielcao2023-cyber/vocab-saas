import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows be worthy of with independently corroborated pronunciation',()=>{
 const word={id:3477,headword:'be worthy of'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('/bi ˈwɜːði əv/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.sources.some(s=>s.url.includes('yyld.51jiaoxi.com/xuanxiusan'))).toBe(true);
 expect(result.lesson.sources.some(s=>s.url.includes('tuhoc.dolenglish.vn'))).toBe(true);
});
