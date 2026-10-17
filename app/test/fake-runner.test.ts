import {it,expect,vi} from 'vitest';
import {runPipeline} from '../server/src/ai/pipeline.ts';
import {fakeRunner,FAKE_MODEL} from '../server/src/ai/fake-runner.ts';
import {exportContent} from '../server/src/ai/transfer.ts';
import {chooseRunner} from '../scripts/ai-generate.ts';
import {database} from './v3-helpers.ts';
import {temp} from './p2-helpers.ts';
import fs from 'node:fs';
it('ai-generate defaults to the fake model and only builds the real runner on an explicit --real',()=>{
  const real=vi.fn(()=>async()=>{throw new Error('never');});
  for(const a of [{},{db:'x',pilot:true},{'dry-run':true}]){const c=chooseRunner(a as any,real);expect(c.fake).toBe(true);expect(c.runner).toBe(fakeRunner);}
  expect(real).not.toHaveBeenCalled();
  expect(chooseRunner({real:true},real).fake).toBe(false);expect(real).toHaveBeenCalledTimes(1);
  expect(()=>chooseRunner({real:'yes'},real)).toThrow('--real');
});
it('fake content is marked, recorded as fake-model, never exported and does not block a later real run',async()=>{
  const db=database(6),root=temp();try{
    for(const [id,h] of [[4,'receive'],[5,'accept'],[6,'whether']] as const)db.prepare('UPDATE words SET headword=? WHERE id=?').run(h,id);
    const r=await runPipeline(db,{root,fake:true,batch:5},fakeRunner);expect(r.calls).toBe(2);
    const rows=db.prepare('SELECT DISTINCT model,prompt_version FROM word_content').all();expect(rows).toEqual([{model:FAKE_MODEL,prompt_version:'p2-v1-fake'}]);
    expect(db.prepare('SELECT COUNT(DISTINCT word_id) n FROM word_content').get()).toEqual({n:6});
    for(const kind of ['example','collocation','mnemonic_association'])expect(db.prepare('SELECT COUNT(*) n FROM word_content WHERE kind=?').get(kind)).toEqual({n:6});
    const receive=db.prepare("SELECT body_json FROM word_content WHERE word_id=4 AND kind='example'").get() as {body_json:string};expect(receive.body_json).toContain('【模拟】');expect(receive.body_json).toContain('receive');
    expect(db.prepare('SELECT DISTINCT model FROM ai_jobs').all()).toEqual([{model:FAKE_MODEL}]);
    db.prepare("UPDATE word_content SET status='approved',approved_at='2026-10-17T00:00:00Z'").run();
    expect(exportContent(db).counts.content).toBe(0);
    expect((await runPipeline(db,{root,fake:true,batch:5},fakeRunner)).calls).toBe(0);
    let realCalls=0;await runPipeline(db,{root,batch:5},async req=>{realCalls++;return fakeRunner(req);});expect(realCalls).toBe(2);
    expect(exportContent(db).counts.content).toBe(0);
    expect((db.prepare("SELECT COUNT(*) n FROM word_content WHERE model='gpt-6-luna'").get() as {n:number}).n).toBeGreaterThan(0);
  }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
it('fake zk scores are inferred, labelled fake and excluded from export',async()=>{
  const db=database(3),root=temp();try{await runPipeline(db,{root,fake:true,kind:'zk_freq'},fakeRunner);
    expect(db.prepare('SELECT DISTINCT is_inferred,source FROM word_freq').all()).toEqual([{is_inferred:1,source:'fake-model/p2-zk-v1-fake'}]);
    expect(db.prepare("SELECT COUNT(*) n FROM word_freq WHERE basis LIKE '%【模拟】%'").get()).toEqual({n:3});
    expect(exportContent(db).counts.frequency).toBe(0);
  }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
