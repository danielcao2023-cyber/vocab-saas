import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('reads cobblestone modifier while preserving stone sense',()=>{
 const r=createLessonReader('data/lessons')({id:3319,headword:'cobblestone'});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id:3319,headword:'cobblestone'}).ok).toBe(true);
 expect(r.lesson.senses.find(s=>s.id==='s1')?.examples.map(e=>e.id)).toEqual(expect.arrayContaining(['s1-e1','s1-e2']));
 const s=r.lesson.senses.find(s=>s.id==='u4-modifier');expect(s?.title).toContain('铺有');expect(s?.examples.length).toBeGreaterThanOrEqual(2);
});
