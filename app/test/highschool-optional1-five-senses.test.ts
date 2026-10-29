import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[2788,'constant','常数；常量'],[2812,'clone','克隆'],[2933,'twin','双胞胎的；成双的'],[2954,'stare','凝视'],[3036,'digest','领会']])('reads validated usage %s %s',(id,headword,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
