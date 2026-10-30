import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows the complete then example without suggesting from on is grammatical',()=>{
 const word={id:2229,headword:'from (then) on'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('then 示例：/frəm ðen ɒn/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('不能直接删去');
 expect(result.lesson.sources.some(s=>s.url.includes('Get_to_the_Top_Plus_5_companion.pdf'))).toBe(true);
});
