import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3277,'awesome','u4-awesome-example'],[3279,'peak','u4-peak-example'],[3290,'a bunch of','u4-bunch-example'],[3298,'enroll','u4-enroll-example']] as const)('reads added textbook example %s',(id,headword,exampleId)=>{
 const r=read({id,headword});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2',exampleId]));
});
