import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('distinguishes demands and factual claims in insist that clauses',()=>{
 const r=read({id:2711,headword:'insist'});expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,{id:2711,headword:'insist'}).ok).toBe(true);
 const demand=r.lesson.senses.find(s=>s.title.includes('要求'));
 const claim=r.lesson.senses.find(s=>s.title.includes('坚称'));
 expect(demand).toBeDefined();expect(claim).toBeDefined();
 if(!demand||!claim)throw new Error('insist senses not separated');
 expect(demand.usageNote).toContain('原形');
 expect(demand.examples.some(e=>/insisted that/i.test(e.en))).toBe(true);
 expect(claim.usageNote).toMatch(/时态/);
 expect(claim.examples.some(e=>e.en.includes('was accurate'))).toBe(true);
});
