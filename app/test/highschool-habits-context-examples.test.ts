import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3498,'abuse','abuse of power'],[3499,'physical','physical object'],[3502,'psychology','psychology of learning'],[3521,'liberation','their liberation'],[3527,'specialist','a specialist'],[3528,'consultant','a consultant'],[3529,'drug','prescribed a drug']])('serves contextual example %s %s',(id,headword,phrase)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses[0].examples.some(x=>x.en.toLowerCase().includes(phrase))).toBe(true);
 expect(result.lesson.senses[0].examples.every(x=>!/(the book discusses|the lesson describes|the report discusses|the report mentions|the article discusses)/i.test(x.en))).toBe(true);
});
