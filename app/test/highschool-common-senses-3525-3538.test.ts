import fs from 'node:fs';
import {expect,it} from 'vitest';
import {validateLesson} from '../server/src/lessons';
const specs=[[3525,['打扰','不安']],[3530,['跳过','跳跃']],[3534,['坚果','螺母']],[3538,['疲惫','磨损']]] as const;
it.each(specs)('%i provides separate valid common senses', (id,titles)=>{
 const d=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8'));
 const indices=titles.map(title=>d.senses.findIndex((s:{title:string})=>s.title.includes(title)));
 expect(indices.every(i=>i>=0)).toBe(true);
 expect(new Set(indices).size).toBe(titles.length);
 const result=validateLesson(d,{id,headword:d.headword});expect(result.ok,result.ok?'':result.errors.join('; ')).toBe(true);
});
