import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[2356,'illustrate','给书刊配插图'],[2370,'hire','租借'],[2383,'tend','照料'],[2414,'disguise','掩盖'],[2449,'admit','准许加入'],[2456,'comic','喜剧演员']])('reads validated usage %s %s',(id,headword,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
