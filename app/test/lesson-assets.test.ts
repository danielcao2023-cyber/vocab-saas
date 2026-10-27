import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {afterEach,expect,it} from 'vitest';
import {copyReviewedLessons} from '../scripts/lesson-assets';
import {manageLesson} from '../web/src/content/lesson-samples/manage';
const dirs:string[]=[];afterEach(()=>{for(const d of dirs.splice(0))fs.rmSync(d,{recursive:true,force:true});});
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'lesson-assets-'));dirs.push(root);const source=path.join(root,'source'),target=path.join(root,'target');fs.mkdirSync(source);fs.mkdirSync(target);return {source,target};}
function write(dir:string,id:number,headword:string){fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify({...structuredClone(manageLesson),wordId:id,headword}));}
it('retains every required core lesson and includes reviewed expansion lessons with matching identities',()=>{const {source,target}=fixture();write(source,1,'manage');write(source,1653,'title');expect(copyReviewedLessons(source,target,[{id:1,headword:'manage',source:'kb2022'},{id:1653,headword:'title',source:'vocabulary'}])).toBe(2);expect(fs.readdirSync(target).sort()).toEqual(['1.json','1653.json']);});
it('rejects a missing core lesson even if an expansion file would keep the total high enough',()=>{const {source,target}=fixture();write(source,1653,'title');expect(()=>copyReviewedLessons(source,target,[{id:1,headword:'manage',source:'kb2022'},{id:1653,headword:'title',source:'vocabulary'}])).toThrow(/core/);});
it('rejects an expansion lesson assigned to the wrong word',()=>{const {source,target}=fixture();write(source,1653,'other');expect(()=>copyReviewedLessons(source,target,[{id:1653,headword:'title',source:'vocabulary'}])).toThrow(/1653/);});
it('rejects a structurally valid draft expansion instead of bundling it',()=>{const {source,target}=fixture();const data={...structuredClone(manageLesson),wordId:1653,headword:'title'};data.editorial.status='draft';fs.writeFileSync(path.join(source,'1653.json'),JSON.stringify(data));expect(()=>copyReviewedLessons(source,target,[{id:1653,headword:'title',source:'vocabulary'}])).toThrow(/1653/);});
