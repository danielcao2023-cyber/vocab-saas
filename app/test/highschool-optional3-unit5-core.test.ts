import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3695,'recite','列举'],[3697,'dawn','开端'],[3703,'mood','语法语气'],[3717,'cherry','樱桃色'],[3736,'polish','上光剂']])('serves textbook sense %s %s',(id,headword,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
