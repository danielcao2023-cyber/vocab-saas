import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3443,'visual','u34-vision'],[4059,'council','u34-services'],[4075,'intermediate','u34-stage']] as const)('reads researched sense for %s',(id,headword,exampleId)=>{
 const r=read({id,headword});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2',exampleId]));
});
