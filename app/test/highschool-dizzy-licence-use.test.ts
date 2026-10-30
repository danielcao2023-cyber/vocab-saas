import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
function lesson(id:number,headword:string){
 const r=read({id,headword});expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);return r.lesson;
}
it('distinguishes feeling dizzy from something causing dizziness',()=>{
 const l=lesson(3531,'dizzy');
 expect(l.senses.some(s=>/头晕/.test(s.meaning)&&s.examples.some(e=>/felt dizzy/i.test(e.en)))).toBe(true);
 expect(l.senses.some(s=>/令人眩晕/.test(s.meaning)&&s.examples.some(e=>/dizzy (height|pace)/i.test(e.en)))).toBe(true);
});
it('prioritizes the standard British noun and verb spellings and labels the rare variant',()=>{
 const l=lesson(3881,'licence');
 expect(l.takeaway).toContain('license');
 expect(l.senses[0].usageNote).toMatch(/少见|较少/);
 expect(l.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com')&&s.supports.some(x=>x.includes('拼写')))).toBe(true);
});
