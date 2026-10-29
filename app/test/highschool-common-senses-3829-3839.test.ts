import fs from 'node:fs';
import {expect,it} from 'vitest';
import {validateLesson} from '../server/src/lessons';
const cases=[[3829,['基础','地基','基金会']],[3837,['共同','关节','接合处']],[3839,['政府首脑','一流']]] as const;
it.each(cases)('%i provides separate validated common senses',(id,titles)=>{
 const d=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8'));
 const indices=titles.map(title=>d.senses.findIndex((s:{title:string})=>s.title.includes(title)));
 expect(indices.every(i=>i>=0)).toBe(true);expect(new Set(indices).size).toBe(titles.length);
 const r=validateLesson(d,{id,headword:d.headword});expect(r.ok,r.ok?'':r.errors.join('; ')).toBe(true);
});
it('distinguishes the Australian premier from the governor',()=>{
 const d=JSON.parse(fs.readFileSync('data/lessons/3839.json','utf8'));
 expect(d.takeaway).toContain('州政府首长');expect(d.senses[0].examples[0].zh).toContain('州政府首长');
});
