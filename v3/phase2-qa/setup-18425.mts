// 18425 测试库：第一期合成历史库副本 + 词形 + 日常高频 + 模拟模型中考打分 + 试点词模拟讲解（仅测试实例批准显示）
import fs from 'node:fs';
import path from 'node:path';
const W='/workspace/vocab-saas/wt-v3p2',Q='/workspace/vocab-saas/v3/phase2-qa';
const {openDb}=await import(W+'/server/src/db.ts');
const {importForms,dailyFrequency,rankZk}=await import(W+'/server/src/freq.ts');
const {runPipeline,pilotWords}=await import(W+'/server/src/ai/pipeline.ts');
const {fakeRunner}=await import(W+'/server/src/ai/fake-runner.ts');
const {approveJob}=await import(W+'/server/src/ai/review.ts');
const out=Q+'/base-18425.db',csv=Q+'/raw/ecdict.csv',root=Q+'/ai-root';
for(const f of [out,out+'-wal',out+'-shm'])fs.rmSync(f,{force:true});fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(root,{recursive:true});
fs.copyFileSync('/workspace/vocab-saas/v3/phase1-qa/hist-b4429a2.db',out);
const db=openDb(out);
const log:any={};
log.forms=importForms(db,csv);log.daily=dailyFrequency(db,csv);
const pilot=pilotWords(db);log.pilot=pilot;
const zk=await runPipeline(db,{root,fake:true,kind:'zk_freq',batch:10},fakeRunner);log.zkCalls=zk.calls;log.zkRank=rankZk(db);
const content=await runPipeline(db,{root,fake:true,pilot:true,batch:5},fakeRunner);log.contentCalls=content.calls;log.pilotDir=content.pilotDir;
const extra=await runPipeline(db,{root,fake:true,words:['go','child (pl. children)','study'],limit:3,batch:1},fakeRunner);log.extraCalls=extra.calls;
for(const {id} of db.prepare("SELECT DISTINCT job_id id FROM word_content WHERE job_id IS NOT NULL").all() as {id:number}[])approveJob(db,id,true);
// 测试实例：review 状态（标了 hard_word 等）也批准，便于看界面；只在 fake-model 内容上做
log.reviewApproved=db.prepare("UPDATE word_content SET status='approved',approved_at=? WHERE status='review' AND model='fake-model' AND hidden_at IS NULL").run(new Date().toISOString()).changes;
log.counts=db.prepare("SELECT kind,status,COUNT(*) n FROM word_content GROUP BY kind,status").all();
log.freq=db.prepare("SELECT grp,source,is_inferred,COUNT(*) n,SUM(rank>0) ranked FROM word_freq GROUP BY grp,source,is_inferred").all();
log.models=db.prepare("SELECT DISTINCT model FROM word_content").all();
db.pragma('wal_checkpoint(TRUNCATE)');db.close();
fs.writeFileSync(Q+'/setup-18425.json',JSON.stringify(log,null,2));console.log(JSON.stringify({...log,pilot:log.pilot.length},null,1));
