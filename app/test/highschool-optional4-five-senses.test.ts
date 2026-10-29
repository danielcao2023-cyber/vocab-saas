import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[3854,'dive','一次跳水或潜水'],[3923,'bond','建立亲密关系'],[3962,'dust','尘土'],[4021,'bounce','弹跳；弹性'],[4009,'relay','轮班人员']])('reads validated usage %s %s',(id,headword,title)=>{
 const result=read({id,headword});expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.some(s=>s.title===title&&s.examples.length>=2)).toBe(true);
});
