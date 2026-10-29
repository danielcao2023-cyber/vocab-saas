import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { validateLesson } from '../server/src/lessons';
const lesson = (id:number) => JSON.parse(readFileSync(new URL(`../data/lessons/${id}.json`,import.meta.url),'utf8'));
const checks = [
 [3404,'会员资格','会员人数'],
 [3413,'切实可行','逼真'], [3414,'艺术','务实'], [3415,'艺术','务实'], [3416,'早期','简陋'],
 [3417,'二维','单薄'], [3418,'尺寸','方面'],
] as const;
it.each(checks)('%i separates %s from %s and links examples to the right sense', (id,first,second)=>{
 const d=lesson(id);
 expect(d.senses.length).toBeGreaterThanOrEqual(2);
 expect(d.senses[0].title).toContain(first);
 expect(d.senses[1].title).toContain(second);
 for (const s of d.senses) {
  expect(s.examples.length).toBeGreaterThanOrEqual(2);
  for (const e of s.examples) expect(e.senseId).toBe(s.id);
 }
 const originalExamples = d.senses.slice(0, 2).flatMap((s:{examples:{id:string}[]})=>s.examples.map(e=>e.id));
 expect(originalExamples).toHaveLength(4);
 expect(new Set(originalExamples).size).toBe(4);
 const allExamples = d.senses.flatMap((s:{examples:{id:string}[]})=>s.examples.map(e=>e.id));
 expect(new Set(allExamples).size).toBe(allExamples.length);
});

it.each(checks)('%i passes the actual published lesson validator', (id) => {
 const d=lesson(id); const result=validateLesson(d,{id,headword:d.headword});
 expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true);
});
