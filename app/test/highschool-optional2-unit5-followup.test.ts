import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3347,'victim','u5-illness-example'],[3357,'ease','u5-ease-example'],[3379,'scream','u5-scream-example'],[3382,'choke','u5-choke-example'],[3385,'slap','u5-slap-example']] as const)('retains prior sense and adds example %s',(id,headword,exampleId)=>{
 const r=read({id,headword});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2',exampleId]));
});
