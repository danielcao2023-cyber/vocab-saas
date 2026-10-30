import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('labels the full-word American reading of the written abbreviation BBQ',()=>{
 const word={id:3835,headword:'BBQ'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('barbecue 美式读法：/ˈbɑrbəˌkju/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('可以按完整词 barbecue 朗读');
 expect(result.lesson.takeaway).toContain('也可按字母读');
 expect(result.lesson.sources.some(s=>s.url==='https://www.collinsdictionary.com/us/dictionary/english/bbq')).toBe(true);
});
