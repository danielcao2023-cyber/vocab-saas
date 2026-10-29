import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3790,'take over','取而代之；占上风'],[3770,'dismiss','消除念头'],[3801,'hazy','记不清楚'],[3805,'turn out','出席；到场']])('reads audited textbook sense %s %s',(id,headword,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
