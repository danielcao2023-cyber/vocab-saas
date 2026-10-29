import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3807,'fall away','逐渐减少'],[3808,'division','分歧'],[3775,'fare','机票价格']])('reads audited textbook sense %s %s',(id,headword,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
