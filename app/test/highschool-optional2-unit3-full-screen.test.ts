import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('reads chew noun while preserving the original examples',()=>{
 const r=createLessonReader('data/lessons')({id:3260,headword:'chew'});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id:3260,headword:'chew'}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2']));
 const s=r.lesson.senses.find(s=>s.id==='u3-chew-noun');expect(s?.title).toContain('咀嚼');expect(s?.examples.length).toBeGreaterThanOrEqual(2);
});
