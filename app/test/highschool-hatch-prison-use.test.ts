import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
function lesson(id:number,headword:string){
 const r=read({id,headword});expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);
 return r.lesson;
}
it('teaches both intransitive and transitive hatching with examples',()=>{
 const l=lesson(3888,'hatch'),s=l.senses.find(x=>x.id==='s1')!;
 expect(s.usageNote).toContain('及物');expect(s.usageNote).toContain('不及物');
 expect(s.examples.some(e=>/hen hatched (her )?eggs/i.test(e.en))).toBe(true);
 expect(s.examples.some(e=>e.en.includes('eggs hatched'))).toBe(true);
});
it('does not equate being in prison with a conviction',()=>{
 const l=lesson(3892,'prison');
 const c=l.senses[0].collocations.find(c=>c.en==='in prison')!;
 expect(c.zh).toContain('在狱中');
 expect(l.takeaway+c.note).toContain('候审');
});
