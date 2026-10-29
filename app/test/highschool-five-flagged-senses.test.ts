import fs from 'node:fs';
import { expect, it } from 'vitest';
import { validateLesson } from '../server/src/lessons';
const cases = [[3919,['撤回','沉默寡言']], [3965,['合唱队','副歌','齐声']], [3388,['障碍物','阻碍']], [3393,['运动','示意']], [3398,['倒塌','崩溃']]] as const;
it.each(cases)('%i separates the checked senses', (id,titles) => {
 const d=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8'));
 const indices=titles.map(title=>d.senses.findIndex((s:{title:string})=>s.title.includes(title)));
 expect(indices.every(i=>i>=0)).toBe(true);
 expect(new Set(indices).size).toBe(titles.length);
 const r=validateLesson(d,{id,headword:d.headword});
 expect(r.ok,r.ok?'':r.errors.join('; ')).toBe(true);
});
