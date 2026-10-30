import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('explains escape doing as avoiding an event, including being hurt',()=>{
 const r=read({id:2476,headword:'escape'});expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,{id:2476,headword:'escape'}).ok).toBe(true);
 const l=r.lesson, combined=[...l.pronunciation.notes,...l.forms.map(f=>f.note)].join(' ');
 expect(combined).not.toContain('逃避做某事');
 expect(combined).toContain('避免');
 expect(l.senses[0].examples.some(e=>e.en==='She escaped being hurt.'&&e.zh.includes('受伤'))).toBe(true);
});
