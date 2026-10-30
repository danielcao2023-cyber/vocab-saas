import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows sourced fixed pronunciation and explains the intervening person',()=>{
 const word={id:2258,headword:'dress sb. up'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('固定部分：/dres/ ... /ˈʌp/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('sb. 是可替换的占位符');
 expect(result.lesson.sources.some(s=>s.url==='https://media3.bsh-group.com/Documents/17196624_KD-Balay_140x196mm_05_2019_copyright.pdf')).toBe(true);
});
