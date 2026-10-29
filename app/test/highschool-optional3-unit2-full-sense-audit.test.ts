import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3530,'skip',['不参加；不做','蹦跳（名词）']],[3543,'refresh',['使感到清爽']]])('reads audited textbook sense %s %s',(id,headword,titles)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 for(const title of titles)expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
