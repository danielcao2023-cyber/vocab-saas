import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3416,'primitive','s3','文艺复兴前'],[3427,'rank','s3','排列'],[3459,'frame','s4','画面']] as const)('preserves existing sense and adds textbook sense %s', (id,headword,senseId,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.length).toBeGreaterThanOrEqual(2);
 const s=result.lesson.senses.find(s=>s.id===senseId);expect(s?.title).toContain(title);expect(s?.examples.length).toBeGreaterThanOrEqual(2);
});
