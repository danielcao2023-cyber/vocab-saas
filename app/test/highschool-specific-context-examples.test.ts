import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3053,'diarrhoea','had diarrhoea'],[3054,'dehydration','dehydration'],[3496,'tobacco','tobacco leaves'],[3497,'alcohol','contains alcohol'],[3526,'cigarette','cigarettes'],[3533,'sugary','sugary'],[3552,'starve','starved']])('serves a checked contextual example %s %s',(id,headword,phrase)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses[0].examples.some(x=>x.en.toLowerCase().includes(phrase))).toBe(true);
 expect(result.lesson.senses[0].examples.every(x=>!/(the article discusses|the report discusses|the report mentions|the label describes)/i.test(x.en))).toBe(true);
});
