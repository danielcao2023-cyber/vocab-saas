import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('explains the placeholder in the complete publisher pronunciation',()=>{
 const word={id:2668,headword:'be willing to do sth.'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('sth 以 something 为例：/bi ˈwɪlɪŋ tə duː ˈsʌmθɪŋ/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('sth 是可替换的占位符');
 expect(result.lesson.sources.some(source=>source.url.includes('lms.e-school.net.ua'))).toBe(true);
});
