import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('reads the British shop sense without losing the original sense',()=>{
 const identity={id:3975,headword:'chemist'};
 const result=createLessonReader('data/lessons')(identity);
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,identity).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 expect(result.lesson.senses.some(s=>s.title==='药房（英式）'&&s.examples.length>=2)).toBe(true);
});
it('reads the effortful movement sense for drag',()=>{
 const identity={id:3993,headword:'drag'};
 const result=createLessonReader('data/lessons')(identity);
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,identity).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 expect(result.lesson.senses.some(s=>s.title==='费力地移动自己'&&s.examples.length>=2)).toBe(true);
});
