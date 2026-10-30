import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('displays the sourced fixed sounds around the variable object',()=>{
 const word={id:2982,headword:'devote ... to'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('固定部分：/dɪˈvəʊt/ ... /tə/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('可替换的占位符');
 expect(result.lesson.takeaway).toContain('时间、精力');
 expect(result.lesson.sources.some(s=>s.url.includes('yyld.51jiaoxi.com/xuanxiuyi'))).toBe(true);
});
