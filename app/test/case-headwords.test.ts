import {it,expect} from 'vitest';
import fs from 'node:fs';
import {runPipeline} from '../server/src/ai/pipeline.ts';
import {fakeRunner} from '../server/src/ai/fake-runner.ts';
import {database} from './v3-helpers.ts';
import {temp} from './p2-helpers.ts';
// 课标里有 miss 和 Miss：同一批里两者都要能保存，而不是整批判为重复输出失败（真实模型同样受影响）。
it.each(['content','zk_freq'] as const)('%s batch with miss and Miss succeeds and keeps each word separate',async kind=>{
  const db=database(5),root=temp();try{db.prepare("UPDATE words SET headword='miss' WHERE id=2").run();db.prepare("UPDATE words SET headword='Miss' WHERE id=3").run();
    await runPipeline(db,{root,fake:true,kind,batch:5},fakeRunner);
    expect(db.prepare('SELECT status FROM ai_jobs').all()).toEqual([{status:'succeeded'}]);
    const table=kind==='content'?'word_content':'word_freq';expect(db.prepare(`SELECT COUNT(DISTINCT word_id) n FROM ${table} WHERE word_id IN (2,3)`).get()).toEqual({n:2});
  }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
it('a genuinely duplicated output word still fails the batch',async()=>{
  const db=database(2),root=temp();try{await runPipeline(db,{root,fake:true,batch:5},async req=>{const r=await fakeRunner(req);const v=JSON.parse(r.stdout);v.items.push(v.items[0]);return {...r,stdout:JSON.stringify(v)};});
    expect(db.prepare('SELECT status FROM ai_jobs').get()).toEqual({status:'failed'});}finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
