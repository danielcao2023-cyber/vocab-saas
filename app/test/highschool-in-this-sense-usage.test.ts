import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('explains textbook in … sense variations without changing the entry identity',()=>{
 const result=createLessonReader('data/lessons')({id:2804,headword:'in this sense'});
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('lesson missing');
 expect(validateLesson(result.lesson,{id:2804,headword:'in this sense'}).ok).toBe(true);
 expect(result.lesson.senses[0].patterns.some(p=>p.en==='in a broader sense')).toBe(true);
 expect(result.lesson.senses[0].examples.some(e=>e.en.toLowerCase().includes('in a broader sense'))).toBe(true);
});
