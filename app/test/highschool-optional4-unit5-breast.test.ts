import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('reads human senses with the original bird examples intact',()=>{
 const identity={id:4029,headword:'breast'};
 const result=createLessonReader('data/lessons')(identity);
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,identity).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 for(const title of ['乳房','胸部（文学用法）'])expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
