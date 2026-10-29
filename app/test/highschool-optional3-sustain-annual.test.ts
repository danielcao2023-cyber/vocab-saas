import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3561,'sustain','遭受损伤或损失'],[3575,'seize','夺取控制权'],[3577,'reform','改正行为'],[3585,'annual','年刊；年鉴']])('serves checked textbook sense %s %s',(id,headword,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
it('gives trend a concrete example',()=>{
 const result=read({id:3568,headword:'trend'});expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id:3568,headword:'trend'}).ok).toBe(true);
 expect(result.lesson.senses[0].examples.some(e=>e.en.includes('trend towards'))).toBe(true);
});
