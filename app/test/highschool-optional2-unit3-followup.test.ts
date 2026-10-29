import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('reads ideal imagined world and model examples while retaining prior examples',()=>{
 const r=createLessonReader('data/lessons')({id:3258,headword:'ideal'});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id:3258,headword:'ideal'}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2','u3-ideal-world','u3-ideal-model']));
});

it.each([[3256,'dairy','s2','u3-dairy-shop'],[3265,'Kazak','s1','u3-kazak-person']] as const)('reads textbook example %s',(id,headword,senseId,exampleId)=>{
 const r=createLessonReader('data/lessons')({id,headword}); expect(r.status).toBe('ready'); if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id===senseId)?.examples.map(e=>e.id)).toContain(exampleId);
});
