import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3414,'realism','u34-realism-quality'],[3420,'set apart from','u34-apart-quality'],[3429,'mythology','u34-myth-belief'],[3464,'ceramic','u34-ceramics-art']] as const)('reads expanded textbook usage %s',(id,headword,eid)=>{
 const r=read({id,headword});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2',eid]));
});
it('reads existing guarantee collateral sense',()=>{const r=read({id:3474,headword:'guarantee'});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');expect(validateLesson(r.lesson,{id:3474,headword:'guarantee'}).ok).toBe(true);expect(r.lesson.senses.find(s=>s.id==='s3')?.examples.length).toBeGreaterThanOrEqual(2)});
