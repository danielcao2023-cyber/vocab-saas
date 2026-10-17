import type { DB } from '../db.ts';
import { randomUUID } from 'node:crypto';
import { learnOrder } from '../learn-order.ts';
import { sha256 } from '../freq.ts';
import { inputHash,validateOutput,saveValidated } from './pipeline.ts';
import { validateContent } from '../content-validate.ts';
import { validationForms } from './forms.ts';

export const EDITOR_MODEL='codex-editor';
export const EDITOR_VERSION='p2-core-editor-v1';
function curriculum(db:DB){return learnOrder(db).map((w,i)=>({headword:w.headword,order:i+1,forms:(db.prepare('SELECT form FROM word_forms WHERE word_id=? ORDER BY form,kind').all(w.id) as {form:string}[]).map(f=>f.form)}));}
/** Import explicitly authored editor output; its provenance never claims a CLI model run. */
export function importEditorContent(db:DB,manifest:any,output:any,yes=false){
  if(manifest?.format!=='vocab-core-editor-manifest'||manifest.version!==1||manifest.model!==EDITOR_MODEL||manifest.prompt_version!==EDITOR_VERSION||!Array.isArray(manifest.words)||!manifest.words.length)throw new Error('invalid editor manifest');
  const list=curriculum(db),listHash=sha256(JSON.stringify(list.map(w=>({headword:w.headword,forms:w.forms})).sort((a,b)=>a.headword.localeCompare(b.headword))));
  const seen=new Set<number>();
  const words=manifest.words.map((entry:any)=>{
    if(!Number.isInteger(entry.id)||seen.has(entry.id))throw new Error('duplicate or invalid manifest word');seen.add(entry.id);
    const word=db.prepare("SELECT id,headword,meaning_zh,level,pos FROM words WHERE id=? AND source='kb2022'").get(entry.id) as any;
    if(!word||word.headword!==entry.headword||word.meaning_zh!==entry.meaning_zh)throw new Error('editor manifest is stale');
    const forms=db.prepare('SELECT form,kind FROM word_forms WHERE word_id=? ORDER BY form,kind').all(word.id) as {form:string;kind:string}[];
    return {...word,forms,input_hash:inputHash('content',EDITOR_VERSION,{...word,forms},listHash,EDITOR_MODEL)};
  });
  const snapshot={words,curriculum:list,kind:'content' as const,version:EDITOR_VERSION,model:EDITOR_MODEL,profile:'core' as const};
  const validated=validateOutput(JSON.stringify(output),snapshot),rejects=validated.flatMap(r=>r.rejects.map(e=>({word:r.word.headword,...e}))),planned=validated.reduce((n,r)=>n+r.blocks.length,0);
  if(!yes)return {planned,written:0,rejects};
  const now=new Date().toISOString();let job=0,written=0;
  db.transaction(()=>{
    job=Number(db.prepare("INSERT INTO ai_jobs(kind,payload_hash,status,started_at,word_ids,model,prompt_version,batch_size,request_id,created_at,finished_at,attempts,error) VALUES ('content',?,?,?,?,?,?,?,?,?,?,0,?)").run(sha256(words.map((w:any)=>w.input_hash).join('|')),rejects.length?(planned?'partial':'failed'):'succeeded',now,JSON.stringify(words.map((w:any)=>w.id)),EDITOR_MODEL,EDITOR_VERSION,words.length,randomUUID(),now,now,rejects.length?JSON.stringify(rejects).slice(0,500):null).lastInsertRowid);
    written=saveValidated(db,job,snapshot,validated);
  })();return {job,planned,written,rejects};
}

/** Revisions require an exact original hash and the current latest row. No row is approved. */
export function applyCorrections(db:DB,input:any,yes=false){
  if(!Array.isArray(input?.corrections))throw new Error('corrections array required');
  const list=curriculum(db),seen=new Set<number>();
  const plan=input.corrections.map((change:any)=>{
    const id=change.content_id;if(!Number.isInteger(id)||seen.has(id))throw new Error('duplicate or invalid content id');seen.add(id);
    const row=db.prepare('SELECT c.*,w.headword,w.meaning_zh FROM word_content c JOIN words w ON w.id=c.word_id WHERE c.id=?').get(id) as any;
    if(!row||sha256(row.body_json)!==change.original_body_hash||row.hidden_at)throw new Error('correction original is stale');
    const latest=db.prepare('SELECT id FROM word_content WHERE word_id=? AND kind=? ORDER BY id DESC LIMIT 1').get(row.word_id,row.kind) as {id:number};
    if(latest.id!==id)throw new Error('correction must target latest version');
    if(!['example','collocation'].includes(row.kind)||typeof change.reason!=='string'||!change.reason.trim())throw new Error('unsupported correction or missing reason');
    const item={word:row.headword,examples:[],collocations:[],distinctions:[],synonyms:[],antonyms:[],pronunciation:null,etymology:null,association:null,related_words:[],[row.kind==='example'?'examples':'collocations']:change.corrected_body};
    const forms=[...db.prepare('SELECT form,kind FROM word_forms WHERE word_id=?').all(row.word_id) as {form:string;kind:string}[],...validationForms(row.headword)];
    const valid=validateContent(item,{headword:row.headword,meaning_zh:row.meaning_zh,forms,curriculum:list});
    if(valid.rejects.length||valid.blocks.length!==1)throw new Error('invalid corrected content: '+row.headword+' '+JSON.stringify(valid.rejects));
    return {row,reason:change.reason,block:valid.blocks[0]};
  });
  const revisions:{old_id:number;new_id:number}[]=[];
  if(yes)db.transaction(()=>{for(const p of plan){
    const old=p.row,now=new Date().toISOString();
    const id=Number(db.prepare("INSERT INTO word_content(word_id,kind,body_json,model,prompt_version,status,flags_json,job_id,input_hash,downgraded_from) VALUES (?,?,?,?,?,'review',?,?,?,?)").run(old.word_id,old.kind,JSON.stringify(p.block.body),old.model,old.prompt_version,JSON.stringify([...p.block.flags,`editorial_revision:${old.id}`]),old.job_id,old.input_hash,old.downgraded_from).lastInsertRowid);
    db.prepare('UPDATE word_content SET hidden_at=?,hidden_reason=? WHERE id=?').run(now,`editorial revision ${id}: ${p.reason}`,old.id);revisions.push({old_id:old.id,new_id:id});
  }})();return {planned:plan.length,written:revisions.length,revisions};
}
