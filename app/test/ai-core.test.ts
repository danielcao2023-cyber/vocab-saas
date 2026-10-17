import {it,expect} from 'vitest';
import fs from 'node:fs';
import {runPipeline,pipelineQueue} from '../server/src/ai/pipeline.ts';
import {contentCoverage} from '../server/src/ai/coverage.ts';
import {database} from './v3-helpers.ts';
import {item,temp,snapshot} from './p2-helpers.ts';
import type {Runner} from '../server/src/ai/codex-runner.ts';
import {curriculumForms,validationForms} from '../server/src/ai/forms.ts';

const examples=[{en:'We go to school together every morning.',zh:'我们每天早上一起去学校。',target:'go'},{en:'I want to go home after lunch.',zh:'我想午饭后回家。',target:'go'}];
const collocations=[{en:'go to school',zh:'去上学'},{en:'go home',zh:'回家'}];
const result=(value:unknown)=>({stdout:JSON.stringify(value),exitCode:0,durationMs:1});
it('imports only explicit curriculum inflections and spelling variants, not abbreviation expansions',()=>{
  expect(curriculumForms('child (pl. children)')).toEqual([{form:'children',kind:'s'}]);
  expect(curriculumForms('be (am, is, are)')).toEqual([{form:'am',kind:'form'},{form:'is',kind:'3'},{form:'are',kind:'form'}]);
  expect(curriculumForms('child（pl. children）')).toEqual([{form:'children',kind:'s'}]);
  expect(curriculumForms('colour (AmE color)')).toEqual([{form:'color',kind:'spelling'}]);
  expect(curriculumForms('AI (= artificial intelligence)')).toEqual([]);
  expect(validationForms('become').map(f=>f.form)).toContain('became');
  expect(validationForms('pay').map(f=>f.form)).toContain('paid');
  expect(validationForms('until (till)').map(f=>f.form)).toContain('till');
});
it('core profile requires both teaching blocks and explicit retry repairs partial output without duplicating the valid block',async()=>{
  const db=database(1),root=temp();db.prepare("UPDATE words SET headword='go' WHERE id=1").run();
  try {
    const partial:Runner=async()=>result({items:[item('go',{examples})]});
    const first=await runPipeline(db,{root,profile:'core'},partial);
    expect(first.calls).toBe(1);expect(first.reports?.[0].status).toBe('partial');
    expect(contentCoverage(db).real.coreGenerated).toBe(0);
    expect((await runPipeline(db,{root,profile:'core'},partial)).calls).toBe(0);
    const fixed=await runPipeline(db,{root,profile:'core',retryFailed:true},async()=>result({items:[item('go',{examples,collocations})]}));
    expect(fixed.calls).toBe(1);expect(db.prepare('SELECT kind,COUNT(*) n FROM word_content GROUP BY kind ORDER BY kind').all()).toEqual([{kind:'collocation',n:1},{kind:'example',n:1}]);
    expect(contentCoverage(db).real).toMatchObject({coreGenerated:1,coreApproved:0});
    expect((await runPipeline(db,{root,profile:'core'},partial)).calls).toBe(0);
  }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
it('core and full profiles have distinct hashes; fake or unlabelled blocks never count as real coverage',()=>{
  const db=database(2);try{
    expect(pipelineQueue(db,{profile:'core'}).words[0].input_hash).not.toBe(pipelineQueue(db,{}).words[0].input_hash);
    for(const [word,kind,model,version,body] of [[1,'example','fake-model','p2-core-v1-fake','[]'],[1,'collocation','gpt-6-luna','p2-core-v1','{"zh":"【模拟】"}'],[2,'example',null,null,'[]']])db.prepare("INSERT INTO word_content(word_id,kind,body_json,status,model,prompt_version) VALUES (?,?,?,'approved',?,?)").run(word,kind,body,model,version);
    const before=snapshot(db),coverage=contentCoverage(db);expect(snapshot(db)).toEqual(before);expect(coverage).toMatchObject({totalWords:2,fakeBlocks:2,unknownModelBlocks:1,real:{words:0,coreGenerated:0,coreApproved:0}});
  }finally{db.close();}
});
it('concurrent CLI workers use isolated jobs while one owner writes every word once',async()=>{
  const db=database(8),root=temp();let active=0,peak=0;const directories=new Set<string>();
  const runner:Runner=async req=>{active++;peak=Math.max(peak,active);expect(directories.has(req.directory)).toBe(false);directories.add(req.directory);try{await new Promise(resolve=>setTimeout(resolve,5));const words=JSON.parse(req.prompt.split('本批：')[1].split('\n课标')[0]);return result({items:words.map((w:any)=>item(w.headword,{association:{text_zh:'想象和同学一起学习的画面。'}}))});}finally{active--;}};
  try{const r=await runPipeline(db,{root,batch:1,concurrency:3},runner);expect(peak).toBe(3);expect(r.calls).toBe(8);expect(db.prepare('SELECT COUNT(*) n,COUNT(DISTINCT word_id) words FROM word_content').get()).toEqual({n:8,words:8});expect(db.prepare("SELECT COUNT(*) n FROM ai_jobs WHERE status='succeeded'").get()).toEqual({n:8});expect((await runPipeline(db,{root,batch:1,concurrency:3},runner)).calls).toBe(0);}finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
it('latest hidden versions never fall back to older ready blocks, while a newer draft leaves the last approved visible',()=>{
  const db=database(1);try{
    const add=(kind:string,status:string,hidden:string|null,body:unknown)=>db.prepare('INSERT INTO word_content(word_id,kind,body_json,status,model,prompt_version,hidden_at) VALUES (1,?,?,?,\'gpt-6-luna\',\'p2-core-v1\',?)').run(kind,JSON.stringify(body),status,hidden);
    add('example','approved',null,examples);add('collocation','approved',null,collocations);
    expect(contentCoverage(db).real).toMatchObject({coreGenerated:1,coreApproved:1,activeBlocks:2});
    add('example','generated',null,examples);
    expect(contentCoverage(db).real).toMatchObject({coreGenerated:1,coreApproved:1,activeBlocks:2});
    add('example','approved','2026-10-17',examples);
    expect(contentCoverage(db).real).toMatchObject({coreGenerated:0,coreApproved:0,activeBlocks:1});
    expect(contentCoverage(db).entries[0].approvedKinds).toEqual(['collocation']);
  }finally{db.close();}
});
it('core repair explicitly replaces a hidden latest block without resurrecting or duplicating other blocks',async()=>{
  const db=database(1),root=temp();db.prepare("UPDATE words SET headword='go' WHERE id=1").run();const runner:Runner=async()=>result({items:[item('go',{examples,collocations})]});
  try{await runPipeline(db,{root,profile:'core'},runner);db.prepare("UPDATE word_content SET hidden_at='2026-10-17' WHERE kind='example'").run();expect(contentCoverage(db).real.coreGenerated).toBe(0);expect(pipelineQueue(db,{profile:'core',retryFailed:true}).words).toHaveLength(1);expect((await runPipeline(db,{root,profile:'core',retryFailed:true},runner)).calls).toBe(1);expect(contentCoverage(db).real).toMatchObject({coreGenerated:1,coreApproved:0});expect(db.prepare("SELECT COUNT(*) n FROM word_content WHERE kind='collocation'").get()).toEqual({n:1});}finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
it('reconcile recovers valid blocks from a saved earlier attempt without another model call',async()=>{
  const db=database(1),root=temp();db.prepare("UPDATE words SET headword='go' WHERE id=1").run();
  try{
    await runPipeline(db,{root,profile:'core'},async()=>result({items:[item('go',{collocations})]}));
    fs.writeFileSync(root+'/.tmp/ai/1/attempt-1.saved.json',JSON.stringify({items:[item('go',{examples})]}));
    const before=db.prepare('SELECT COUNT(*) n FROM word_content').get();expect(before).toEqual({n:1});
    const recovered=await runPipeline(db,{root,profile:'core',reconcile:true,shouldStop:()=>true},async()=>{throw new Error('reconcile must not call model');});
    expect(recovered.calls).toBe(0);expect(contentCoverage(db).real).toMatchObject({coreGenerated:1,coreApproved:0});
    expect(db.prepare('SELECT status FROM ai_jobs WHERE id=1').get()).toEqual({status:'succeeded'});
    await runPipeline(db,{root,profile:'core',reconcile:true,shouldStop:()=>true},async()=>{throw new Error('must stay idempotent');});
    expect(db.prepare('SELECT COUNT(*) n FROM word_content').get()).toEqual({n:2});
  }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
