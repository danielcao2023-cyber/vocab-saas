import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows a sourced example and explains replaceable objects',()=>{
 const word={id:2359,headword:'carry sb. through sth.'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('sb./sth. 以 someone/something 为例：/ˈkæri ˈsʌmwʌn θruː ˈsʌmθɪŋ/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('sb. 和 sth. 是可替换的占位符');
 expect(result.lesson.sources.some(s=>s.url.includes('tuhoc.dolenglish.vn'))).toBe(true);
});
