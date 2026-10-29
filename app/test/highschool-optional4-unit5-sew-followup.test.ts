import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('reads the textile-making sense without losing original examples',()=>{
 const identity={id:4070,headword:'sew'};const result=createLessonReader('data/lessons')(identity);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,identity).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 expect(result.lesson.senses.some(s=>s.title==='缝制衣物'&&s.examples.length>=2)).toBe(true);
});
