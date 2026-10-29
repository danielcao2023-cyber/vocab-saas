import fs from 'node:fs';
import {expect,it} from 'vitest';
import {validateLesson} from '../server/src/lessons';
const cases=[[3644,['解决','决定','决心（名词）']],[3645,['个人','决议','解决','分辨率']],[3652,['树皮','狗叫']]] as const;
it.each(cases)('%i provides separate validated common senses',(id,titles)=>{
 const d=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8'));
 const indices=titles.map(title=>d.senses.findIndex((s:{title:string})=>s.title.includes(title)));
 expect(indices.every(i=>i>=0)).toBe(true);expect(new Set(indices).size).toBe(titles.length);
 const r=validateLesson(d,{id,headword:d.headword});expect(r.ok,r.ok?'':r.errors.join('; ')).toBe(true);
});
