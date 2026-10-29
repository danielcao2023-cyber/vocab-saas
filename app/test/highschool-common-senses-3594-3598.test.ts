import fs from 'node:fs';
import {expect,it} from 'vitest';
import {validateLesson} from '../server/src/lessons';
const cases=[[3594,['起源','创立']],[3595,['数量','体积','音量','卷']],[3597,['企业','进取']],[3598,['修复','归还']]] as const;
it.each(cases)('%i offers distinct validated common senses', (id,titles)=>{
 const d=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8'));
 const indices=titles.map(title=>d.senses.findIndex((s:{title:string})=>s.title.includes(title)));
 expect(indices.every(i=>i>=0)).toBe(true);expect(new Set(indices).size).toBe(titles.length);
 const r=validateLesson(d,{id,headword:d.headword});expect(r.ok,r.ok?'':r.errors.join('; ')).toBe(true);
});
