import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([[120,'bath','u5-bath-verb','给……洗澡'],[3390,'grab','u5-grab-noun','抓取']] as const)('reads textbook sense %s', (id,headword,senseId,title)=>{
 const r=read({id,headword});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id===(id===120?'bath-1':'s1'))?.examples.length).toBeGreaterThanOrEqual(2);
 const s=r.lesson.senses.find(s=>s.id===senseId);expect(s?.title).toContain(title);expect(s?.examples.length).toBeGreaterThanOrEqual(2);
});
