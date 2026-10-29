import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('reads campaign leadership example without losing prior examples',()=>{
 const r=createLessonReader('data/lessons')({id:3605,headword:'campaign'});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id:3605,headword:'campaign'}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s2')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s2-e1','s2-e2','u3-campaign-leader']));
});
