import fs from 'node:fs';
import {expect,it} from 'vitest';
import {validateLesson} from '../server/src/lessons';
const specs=[[3461,['下降','拒绝']],[3467,['进入','入口','条目','参赛']], [3468,['公民','礼貌']],[3475,['当代','同时代']]] as const;
it.each(specs)('%i publishes distinct common senses', (id,titles)=>{
 const data=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8'));
 const indices=titles.map(title=>data.senses.findIndex((s:{title:string})=>s.title.includes(title)));
 expect(indices.every(i=>i>=0)).toBe(true);
 expect(new Set(indices).size).toBe(titles.length);
 const result=validateLesson(data,{id,headword:data.headword});
 expect(result.ok,result.ok?'':result.errors.join('; ')).toBe(true);
});
