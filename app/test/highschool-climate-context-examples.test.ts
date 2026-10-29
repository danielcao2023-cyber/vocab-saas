import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3550,'emission','vehicle emissions'],[3556,'methane','colourless'],[3557,'carbon','coal contains carbon'],[3559,'carbon dioxide','breathe out carbon dioxide'],[3560,'habitable','habitable'],[3590,'nuclear','nuclear power'],[3593,'smog','smog']])('serves contextual example %s %s',(id,headword,phrase)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses[0].examples.some(x=>x.en.toLowerCase().includes(phrase))).toBe(true);
 expect(result.lesson.senses[0].examples.every(x=>!/(the article discusses|the report discusses)/i.test(x.en))).toBe(true);
});
