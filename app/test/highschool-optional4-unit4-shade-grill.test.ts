import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3976,'shade',['灯罩','把图画涂暗']],[3989,'grill',['餐馆']]])('reads textbook senses %s %s',(id,headword,titles)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toContain('s1-e1');
 for(const title of titles) expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
