import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('explains the changeable object in the sourced pronunciation',()=>{
 const word={id:3473,headword:'bring ... to life'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('... 以 something 为例：/brɪŋ ˈsʌmθɪŋ tu ˈlaɪf/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('可替换的占位符');
 expect(result.lesson.sources.some(s=>s.url==='https://zpe.gov.pl/a/slownik-i-bibliografia/DkMQX1QUv')).toBe(true);
});
