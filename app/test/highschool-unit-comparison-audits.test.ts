import {expect,it} from 'vitest';
import fs from 'node:fs';
import {validateLesson} from '../server/src/lessons';
it('validates reviewed high school comparison lessons and their source provenance',()=>{
 for(const id of [4001,4002,4003,4007,4011,4012,4069,4070,4071,4072,4073]){
  const data=JSON.parse(fs.readFileSync(new URL(`../data/lessons/${id}.json`,import.meta.url),'utf8'));
  expect(validateLesson(data,{id,headword:data.headword}).ok,`${id}`).toBe(true);
 }
});
