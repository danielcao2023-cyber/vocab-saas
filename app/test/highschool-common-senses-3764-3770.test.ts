import fs from 'node:fs';
import {expect,it} from 'vitest';
import {validateLesson} from '../server/src/lessons';
const cases=[[3764,['预约','任命']],[3765,['指甲','钉子','钉牢']],[3768,['暂停','悬挂']],[3770,['解雇','离开','考虑']]] as const;
it.each(cases)('%i provides separate validated common senses',(id,titles)=>{
 const d=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8'));
 const indices=titles.map(title=>d.senses.findIndex((s:{title:string})=>s.title.includes(title)));
 expect(indices.every(i=>i>=0)).toBe(true);expect(new Set(indices).size).toBe(titles.length);
 const r=validateLesson(d,{id,headword:d.headword});expect(r.ok,r.ok?'':r.errors.join('; ')).toBe(true);
});
