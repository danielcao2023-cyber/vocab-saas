import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
function lesson(id:number,headword:string){
 const r=read({id,headword});expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);return r.lesson;
}
it('distinguishes pledged property from an unspecified guarantee',()=>{
 const l=lesson(3474,'guarantee');
 const s=l.senses.find(x=>x.title.includes('担保物'))!;
 expect(s.meaning).not.toContain('暂时交出');
 expect(s.usageNote).toMatch(/违约|未履行/);
 const debt=l.senses.flatMap(x=>x.examples).find(e=>e.en.includes('bank required'))!;
 expect(debt.zh).not.toContain('担保物');
});
it('explains carbon footprint in terms of greenhouse gases rather than literal footprints',()=>{
 const l=lesson(3572,'footprint');
 const carbon=l.senses.find(s=>s.title.includes('碳足迹'));
 expect(carbon).toBeDefined();
 if(!carbon)throw new Error('carbon sense missing');
 expect(carbon.meaning).toContain('温室气体');
 expect(carbon.examples.some(e=>e.en.includes('carbon footprint'))).toBe(true);
 expect(l.sources.some(s=>s.url.includes('epa.gov')&&s.supports.some(x=>x.includes('碳足迹')))).toBe(true);
});
