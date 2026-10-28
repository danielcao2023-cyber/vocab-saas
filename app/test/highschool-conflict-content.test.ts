import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
it('distinguishes the noun and verb in the conflict lesson introduction',()=>{
 const result=createLessonReader()({id:2968,headword:'conflict'});
 expect(result.status).toBe('ready');
 if(result.status!=='ready')return;
 expect(result.lesson.headline).toContain('名词');
 expect(result.lesson.headline).toContain('动词');
 expect(result.lesson.takeaway).toContain('conflict with');
});
