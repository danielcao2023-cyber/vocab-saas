import {expect, it} from 'vitest';
import {createLessonReader, validateLesson} from '../server/src/lessons.ts';
const reader=createLessonReader('data/lessons');
it.each([[3522,'shave','刮脸'],[3555,'release','排放'],[3626,'crush','拥挤的人群'],[3683,'sorrow','感到悲伤'],[3707,'format','总体安排']])('reads validated usage %s %s',(id,headword,title)=>{
 const result=reader({id,headword}); expect(result.status).toBe('ready');
 if(result.status!=='ready') throw new Error('lesson missing');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.some(s=>s.title===title && s.examples.length>=2)).toBe(true);
});
