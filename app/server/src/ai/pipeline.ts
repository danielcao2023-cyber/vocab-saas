import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DB } from '../db.ts';
import { learnOrder } from '../learn-order.ts';
import { sha256 } from '../freq.ts';
import { validateContent, validateZk, canonical, type WordContext, type ValidBlock } from '../content-validate.ts';
import { setting } from '../settings.ts';
import { MODEL, extractJson, projectRoot, type Runner, type RunnerResult } from './codex-runner.ts';
import { FAKE_MODEL, FAKE_SUFFIX } from './fake-runner.ts';
import { mainHeadwords } from '../text.ts';
import { CONTENT_VERSION,ZK_VERSION,makePrompt } from './prompts.ts';
import { contentSchema,zkSchema } from './schema.ts';
/** fake=true：模拟模型（默认）。记录 model=fake-model、prompt_version 加 -fake 后缀，input_hash 因此与真实模型不同，真实运行不会因模拟内容而跳过。 */
export interface PipelineOptions {fake?:boolean;kind?:'content'|'zk_freq';batch?:number;limit?:number;words?:string[];pilot?:boolean;dryRun?:boolean;retryFailed?:boolean;reconcile?:boolean;root?:string;shouldStop?:()=>boolean;log?:(text:string)=>void}
interface InputWord {id:number;headword:string;meaning_zh:string|null;level:string|null;pos:string|null;forms:{form:string;kind:string}[];input_hash:string}
interface Snapshot {words:InputWord[];curriculum:WordContext['curriculum'];kind:'content'|'zk_freq';version:string;model?:string}
export function inputHash(kind:string,version:string,w:Omit<InputWord,'input_hash'>,listHash:string,model:string=MODEL) {return sha256(JSON.stringify([kind,version,model,w.headword,w.meaning_zh,w.level,w.forms,listHash]));}
export function acquireLock(file:string) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  try {const fd=fs.openSync(file,'wx');fs.writeFileSync(fd,String(process.pid));fs.closeSync(fd);}catch(e:any){
    if(e.code!=='EEXIST')throw e;const pid=Number(fs.readFileSync(file,'utf8'));if(!Number.isInteger(pid)||pid<=0)throw new Error('invalid generate.lock; inspect before removing');
    try{process.kill(pid,0);}catch(err:any){if(err.code==='ESRCH'){fs.unlinkSync(file);return acquireLock(file);}throw new Error('generator is already running');}throw new Error('generator is already running');
  }
  return ()=>{if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')===String(process.pid))fs.unlinkSync(file);};
}
export function pilotWords(db:DB,order=learnOrder(db)) {
  const learned=new Set((db.prepare("SELECT word_id FROM cards WHERE mode='recognize' AND state<>0").all() as {word_id:number}[]).map(x=>x.word_id));
  const words=order.filter(w=>!learned.has(w.id)).slice(0,20).map(w=>w.headword);
  for(const w of ['receive','accept','whether'])if(!words.some(x=>canonical(x)===w))words.push(w);return words;
}
export function pipelineQueue(db:DB,opts:PipelineOptions) {
  const kind=opts.kind??'content',model=opts.fake?FAKE_MODEL:MODEL,version=(kind==='content'?CONTENT_VERSION:ZK_VERSION)+(opts.fake?FAKE_SUFFIX:'');
  const order=learnOrder(db),all=db.prepare("SELECT id,headword,meaning_zh,level,pos FROM words WHERE source='kb2022' ORDER BY id").all() as Omit<InputWord,'forms'|'input_hash'>[];
  const curriculum=order.map((w,i)=>({headword:w.headword,order:i+1,forms:(db.prepare('SELECT form FROM word_forms WHERE word_id=? ORDER BY form,kind').all(w.id) as {form:string}[]).map(f=>f.form)}));
  const listHash=sha256(JSON.stringify(curriculum.map(w=>({headword:w.headword,forms:w.forms})).sort((a,b)=>a.headword.localeCompare(b.headword))));
  const due=db.prepare('SELECT word_id,MIN(due) due FROM cards GROUP BY word_id ORDER BY due,word_id').all() as {word_id:number}[];
  const priority=kind==='zk_freq'?all.map(w=>w.id):[...due.map(w=>w.word_id),...order.map(w=>w.id)];
  // --words：先按整条词头匹配；没有时按主词头（去掉括号注释，如 child → child (pl. children)）匹配。
  const resolveName=(name:string)=>{const exact=all.filter(w=>canonical(w.headword)===canonical(name));return (exact.length?exact:all.filter(w=>mainHeadwords(w.headword).some(v=>canonical(v)===canonical(name)))).map(w=>w.headword);};
  const specified=opts.words?opts.words.flatMap(name=>{const found=resolveName(name);if(!found.length)throw new Error(`unknown requested word: ${name}`);return found;}):(opts.pilot?pilotWords(db,order):[]);
  const wanted=new Set(specified.map(canonical));
  let words=all.map(w=>{const forms=db.prepare('SELECT form,kind FROM word_forms WHERE word_id=? ORDER BY form,kind').all(w.id) as InputWord['forms'];return {...w,forms,input_hash:inputHash(kind,version,{...w,forms},listHash,model)};});
  if(opts.pilot)words=words.filter(w=>wanted.has(canonical(w.headword)));
  words.sort((a,b)=>Number(wanted.has(canonical(b.headword)))-Number(wanted.has(canonical(a.headword)))||(wanted.has(canonical(a.headword))&&wanted.has(canonical(b.headword))?specified.map(canonical).indexOf(canonical(a.headword))-specified.map(canonical).indexOf(canonical(b.headword)):priority.indexOf(a.id)-priority.indexOf(b.id))||a.id-b.id);
  const unresolved=db.prepare("SELECT word_ids,status FROM ai_jobs j WHERE kind=? AND (status IN ('running','unknown') OR (status='failed' AND NOT EXISTS (SELECT 1 FROM ai_cache c WHERE c.key_hash LIKE 'p2:%' AND CAST(c.answer AS INTEGER)=j.id)))").all(kind) as {word_ids:string|null;status:string}[];
  words=words.filter(w=>{
    if(unresolved.some(j=>{if(j.status==='failed'&&opts.retryFailed)return false;try{return JSON.parse(j.word_ids??'[]').includes(w.id);}catch{return true;}}))return false;
    if(kind==='content'&&db.prepare('SELECT 1 FROM word_content WHERE word_id=? AND input_hash=?').get(w.id,w.input_hash))return false;
    const cached=db.prepare('SELECT j.status FROM ai_cache c JOIN ai_jobs j ON j.id=CAST(c.answer AS INTEGER) WHERE c.key_hash=?').get(`p2:${w.input_hash}`) as {status:string}|undefined;
    if(cached)return opts.retryFailed&&cached.status==='failed';
    return opts.retryFailed?unresolved.some(j=>j.status==='failed'&&JSON.parse(j.word_ids??'[]').includes(w.id)):true;
  });
  if(opts.limit!==undefined)words=words.slice(0,opts.limit);
  return {words,curriculum,version,kind,model};
}
function validateOutput(raw:string,snapshot:Snapshot) {
  const value=extractJson(raw);if(!value||Object.keys(value).join()!=='items'||!Array.isArray(value.items))throw new Error('output must be {items:[]}');
  // 同批可能有只差大小写的词头（miss / Miss）：先按原词头精确匹配，只有唯一时才按 canonical 匹配。
  const resolve=(word:string)=>{const exact=snapshot.words.find(w=>w.headword.trim()===word.trim());if(exact)return exact;const c=snapshot.words.filter(w=>canonical(w.headword)===canonical(word));return c.length===1?c[0]:undefined;};
  const byId=new Map<number,any>();
  for(const item of value.items){const w=typeof item?.word==='string'?resolve(item.word):undefined;if(!w||byId.has(w.id))throw new Error('unexpected or duplicate output word');byId.set(w.id,item);}
  const results=snapshot.words.map(w=>{
    const item=byId.get(w.id);
    if(!item)return {word:w,blocks:[] as ValidBlock[],rejects:[{kind:'item',reason:'missing output word'}],zk:null};
    if(snapshot.kind==='zk_freq'){try{return {word:w,blocks:[] as ValidBlock[],rejects:[],zk:validateZk(item,w.headword)};}catch(e){return {word:w,blocks:[] as ValidBlock[],rejects:[{kind:'zk_freq',reason:(e as Error).message}],zk:null};}}
    return {word:w,...validateContent(item,{headword:w.headword,meaning_zh:w.meaning_zh,forms:w.forms,curriculum:snapshot.curriculum}),zk:null};
  });return results;
}
function saveValidated(db:DB,jobId:number,snapshot:Snapshot,results:ReturnType<typeof validateOutput>) {
  let accepted=0;
  db.transaction(()=>{for(const r of results){
    if(snapshot.kind==='content'){if(db.prepare('SELECT 1 FROM word_content WHERE word_id=? AND input_hash=?').get(r.word.id,r.word.input_hash))continue;
      for(const b of r.blocks){db.prepare('INSERT INTO word_content(word_id,kind,body_json,model,prompt_version,status,flags_json,job_id,input_hash,downgraded_from) VALUES (?,?,?,?,?,?,?,?,?,?)').run(r.word.id,b.kind,JSON.stringify(b.body),snapshot.model??MODEL,snapshot.version,b.status,JSON.stringify(b.flags),jobId,r.word.input_hash,b.downgraded_from??null);accepted++;}}
    else if(r.zk){db.prepare(`INSERT INTO word_freq(word_id,grp,rank,score,basis,source,is_inferred,job_id,created_at) VALUES (?,'zk_high',0,?,?,?,1,?,?) ON CONFLICT(word_id,grp) DO UPDATE SET rank=0,score=excluded.score,basis=excluded.basis,source=excluded.source,is_inferred=1,job_id=excluded.job_id,created_at=excluded.created_at`).run(r.word.id,r.zk.score,`${r.zk.basis_zh}（模型推断，非真题统计）`,`${snapshot.model??MODEL}/${snapshot.version}`,jobId,new Date().toISOString());accepted++;}
  }})();return accepted;
}
function finishJob(db:DB,id:number,status:string,duration:number,error:string|null) {db.prepare('UPDATE ai_jobs SET status=?,duration_ms=?,finished_at=?,error=? WHERE id=?').run(status,duration,new Date().toISOString(),error?.slice(0,500)??null,id);}
export async function runPipeline(db:DB,opts:PipelineOptions,runner:Runner) {
  const batch=opts.batch??setting(db,'ai_batch_size',5);if(![1,5,10].includes(batch))throw new Error('--batch must be 1, 5 or 10');if(opts.limit!==undefined&&(!Number.isInteger(opts.limit)||opts.limit<1))throw new Error('invalid limit');
  const root=opts.root??projectRoot(),temp=path.join(root,'.tmp/ai');
  const plan=()=>{const q=pipelineQueue(db,opts);return {...q,batches:Array.from({length:Math.ceil(q.words.length/batch)},(_,i)=>{const words=q.words.slice(i*batch,(i+1)*batch);return {words,payload_hash:sha256(words.map(w=>w.input_hash).sort().join('|'))};})};};
  if(opts.dryRun){const p=plan();return {dryRun:true,batches:p.batches.map(b=>({words:b.words.map(w=>w.headword),hash:b.payload_hash})),calls:0};}
  const unlock=acquireLock(path.join(temp,'generate.lock'));let calls=0;const started=Date.now();const reports:any[]=[];
  try {
    db.prepare("UPDATE ai_jobs SET status='unknown',error='interrupted before completion' WHERE status='running'").run();
    if(opts.reconcile){const jobs=db.prepare("SELECT * FROM ai_jobs WHERE status='unknown'").all() as any[];
      for(const job of jobs){try{const snap=JSON.parse(fs.readFileSync(path.join(temp,String(job.id),'request.json'),'utf8')) as Snapshot;const file=[job.output_file,path.join(temp,String(job.id),'output.json')].find(f=>f&&fs.existsSync(f));if(!file)throw new Error('missing output');const results=validateOutput(fs.readFileSync(file,'utf8'),snap);const count=saveValidated(db,job.id,snap,results);const errors=results.flatMap(r=>r.rejects.map(x=>x.reason));finishJob(db,job.id,errors.length?(count?'partial':'failed'):'succeeded',job.duration_ms??0,errors.join('; ')||null);}catch{finishJob(db,job.id,'failed',job.duration_ms??0,'reconcile could not validate saved output');}}
    }
    const p=plan();const pilotDir=opts.pilot?path.join(root,'app/qa/ai-pilot',new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}).replace(/[: ]/g,'-')+'-'+randomUUID().slice(0,8)):null;
    if(pilotDir)fs.mkdirSync(pilotDir,{recursive:true});
    for(const b of p.batches){if(opts.shouldStop?.())break;
      if(db.prepare("SELECT 1 FROM ai_jobs WHERE payload_hash=? AND status='succeeded'").get(b.payload_hash))continue;
      const created=new Date().toISOString();const id=Number(db.prepare("INSERT INTO ai_jobs(kind,payload_hash,status,started_at,word_ids,model,prompt_version,batch_size,request_id,created_at) VALUES (?,?,'running',?,?,?,?,?,?,?)").run(p.kind,b.payload_hash,created,JSON.stringify(b.words.map(w=>w.id)),p.model,p.version,b.words.length,randomUUID(),created).lastInsertRowid);
      const directory=path.join(temp,String(id)),outputFile=path.join(root,'app/data/ai-raw',`${id}.json`);fs.mkdirSync(directory,{recursive:true});fs.mkdirSync(path.dirname(outputFile),{recursive:true});
      db.prepare('UPDATE ai_jobs SET output_file=? WHERE id=?').run(outputFile,id);
      const snapshot:Snapshot={words:b.words,curriculum:p.curriculum,kind:p.kind,version:p.version,model:p.model};fs.writeFileSync(path.join(directory,'request.json'),JSON.stringify(snapshot));
      for(const w of b.words)db.prepare('INSERT OR REPLACE INTO ai_cache(key_hash,word_id,question,answer,created_at) VALUES (?,?,?,?,?)').run(`p2:${w.input_hash}`,w.id,p.kind,String(id),created);
      let result:RunnerResult={stdout:'',exitCode:null,durationMs:0},validated:ReturnType<typeof validateOutput>=[],errors:string[]=[],attempts=0;const tick=Date.now();
      const max=opts.retryFailed?1:Math.max(1,Math.min(2,setting(db,'ai_max_attempts',2)));
      while(attempts<max){attempts++;db.prepare('UPDATE ai_jobs SET attempts=? WHERE id=?').run(attempts,id);calls++;
        try{result=await runner({prompt:makePrompt(p.kind,b.words,p.curriculum,errors),schema:p.kind==='content'?contentSchema:zkSchema,jobId:id,directory,timeoutMs:setting(db,'ai_timeout_ms',600000)});fs.writeFileSync(outputFile,result.stdout);fs.writeFileSync(path.join(directory,'output.json'),result.stdout);
          if(result.timedOut||result.exitCode!==0){errors=[result.timedOut?'timeout':'process exited unsuccessfully'];validated=[];}
          else{validated=validateOutput(result.stdout,snapshot);errors=validated.flatMap(r=>r.rejects.map(x=>`${r.word.headword}/${x.kind}: ${x.reason}`));}
        }catch{errors=['runner or JSON output failed'];validated=[];}
        if(!errors.length||opts.shouldStop?.())break;
      }
      const accepted=saveValidated(db,id,snapshot,validated),duration=Date.now()-tick;
      const status=errors.length?(accepted?'partial':'failed'):'succeeded';finishJob(db,id,status,duration,errors.join('; ')||null);
      const report={job:id,words:b.words.map(w=>w.headword),batchSize:b.words.length,durationMs:duration,retries:attempts-1,exitCode:result.exitCode,status,accepted,flagged:validated.flatMap(r=>r.blocks).filter(b=>b.flags.length).length,rejected:validated.reduce((n,r)=>n+r.rejects.length,0),downgraded:validated.flatMap(r=>r.blocks).filter(b=>b.downgraded_from).length};reports.push({...report,validated});opts.log?.(`batch ${id}: ${duration} ms (${b.words.length} words, ${status})`);
      if(pilotDir){const n=reports.length;fs.writeFileSync(path.join(pilotDir,`batch-${n}.raw.json`),result.stdout);fs.writeFileSync(path.join(pilotDir,`batch-${n}.validated.json`),JSON.stringify(validated,null,2));}
    }
    if(pilotDir){const elapsed=Date.now()-started,words=reports.reduce((n,r)=>n+r.words.length,0);fs.writeFileSync(path.join(pilotDir,'summary.md'),`# AI 试点\n\n模型：${p.model}${opts.fake?'（模拟模型，内容不是真实生成）':''}；内容均未批准。\n\n|批|词|批大小|耗时 ms|重试|退出码|通过|标记|拒绝|降级|\n|---|---|---|---|---|---|---|---|---|---|\n`+reports.map(r=>`|${r.job}|${r.words.join(', ')}|${r.batchSize}|${r.durationMs}|${r.retries}|${r.exitCode}|${r.accepted}|${r.flagged}|${r.rejected}|${r.downgraded}|`).join('\n')+`\n\n总耗时：${elapsed} ms；平均每词：${words?elapsed/words:0} ms。\n`);fs.writeFileSync(path.join(pilotDir,'samples.md'),'# 可读样例\n\n'+reports.flatMap(r=>r.validated.map((w:any)=>`## ${w.word.headword}\n\n`+w.blocks.map(readableBlock).join('\n')+(w.rejects.length?'\n拒绝：'+w.rejects.map((x:any)=>`${x.kind}: ${x.reason}`).join('；'):'')).join('\n')).join('\n'));}
    return {calls,reports,pilotDir,durationMs:Date.now()-started};
  }finally{unlock();}
}

function readableBlock(b:ValidBlock) {
  const labels:Record<string,string>={example:'例句',collocation:'常见搭配',distinction:'易混词',synonym:'近义',antonym:'反义',pronunciation:'发音',mnemonic_etymology:'词源',mnemonic_association:'联想（不是词源）',related_words:'相关词'};
  const body=b.body;let lines:string[]=[];
  if(b.kind==='example'||b.kind==='collocation')lines=body.map((x:any)=>`${x.en} — ${x.zh}`);
  else if(b.kind==='distinction')lines=body.map((x:any)=>`${x.words.join(' / ')}：${x.explain_zh}${x.example?`\n${x.example.en} — ${x.example.zh}`:''}`);
  else if(['synonym','antonym','related_words'].includes(b.kind))lines=body.map((x:any)=>`${x.word}：${x.note_zh??x.zh}${x.in_list?'（课标词）':'（课标外）'}`);
  else if(b.kind==='pronunciation')lines=[body.syllables.map((s:string,i:number)=>i===body.stress?s.toUpperCase():s).join(' · '),...body.points_zh,...body.common_errors_zh];
  else if(b.kind==='mnemonic_etymology')lines=[body.chain,body.parts.map((p:any)=>`${p.form}「${p.meaning_zh}」`).join(' + '),body.explain_zh,...body.same_root.map((x:any)=>`同根词 ${x.word}：${x.zh}`)];
  else lines=[body.text_zh];
  return `### ${labels[b.kind]}（${b.status}）\n\n${lines.join('\n\n')}\n\n标记：${b.flags.join('、')||'无'}${b.downgraded_from?'；由词源降级':''}\n`;
}
