import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3426,'noble','s1','u34-noble-grand'],[3467,'entry','s1','u34-entry-competition']] as const)('reads expanded textbook usage %s',(id,headword,senseId,exampleId)=>{
 const r=read({id,headword});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id===senseId)?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2',exampleId]));
});
it('retains exhibition skill sense',()=>{
 const r=read({id:3462,headword:'exhibition'});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id:3462,headword:'exhibition'}).ok).toBe(true);expect(r.lesson.senses.find(s=>s.id==='s2')?.examples.length).toBeGreaterThanOrEqual(2);
});
