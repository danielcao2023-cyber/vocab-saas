import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { DB } from '../db.ts';
import { sha256 } from '../freq.ts';
import { KINDS } from '../content-validate.ts';
const contentKeys=['kind','body_json','flags_json','input_hash','downgraded_from','approved_at','hidden_at','hidden_reason','model','prompt_version'] as const;
const freqKeys=['grp','rank','score','basis','source','is_inferred'] as const;
const pick=(r:any,keys:readonly string[])=>Object.fromEntries(keys.map(k=>[k,r[k]??null]));
export function assertPhase2(db:DB) {
  for(const [table,columns] of Object.entries({words:['source','headword'],word_content:['word_id','status',...contentKeys],word_freq:['word_id',...freqKeys,'created_at']})) {
    const existing=(db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(x=>x.name);
    if(!columns.every(c=>existing.includes(c)))throw new Error('target requires phase-two migration');
  }
}
// 模拟模型（fake-model）内容只用于测试实例，永不导出。
export function exportContent(db:DB,now=new Date()) {
  assertPhase2(db);
  const content=(db.prepare("SELECT c.*,w.source word_source,w.headword FROM word_content c JOIN words w ON w.id=c.word_id WHERE c.status='approved' AND c.model IS NOT 'fake-model' ORDER BY w.source,w.headword,c.id").all() as any[]).map(r=>({word_source:r.word_source,headword:r.headword,...pick(r,contentKeys)}));
  const frequency=(db.prepare('SELECT f.*,w.source word_source,w.headword FROM word_freq f JOIN words w ON w.id=f.word_id WHERE f.source NOT LIKE ? ORDER BY w.source,w.headword,f.grp').all('fake-model/%') as any[]).map(r=>({word_source:r.word_source,headword:r.headword,...pick(r,freqKeys)}));
  const body={content:content.map((entry:any)=>{const {body_json,...row}=entry;return {...row,body:JSON.parse(body_json)};}),frequency};return {format:'vocab-p2-content',version:1,exported_at:now.toISOString(),counts:{content:content.length,frequency:frequency.length},sha256:sha256(JSON.stringify(body)),body};
}
function resolved(file:string) {let p=path.resolve(file),suffix:string[]=[];while(!fs.existsSync(p)){const parent=path.dirname(p);if(parent===p)break;suffix.unshift(path.basename(p));p=parent;}return path.join(fs.realpathSync(p),...suffix);}
export function protectTarget(file:string,home=os.homedir()) {
  if(file===':memory:')return;
  const dbPath=resolved(file),apps=resolved(path.join(home,'apps'));
  if(dbPath===apps||dbPath.startsWith(apps+path.sep))throw new Error('正式库要在上线时另批');
}
export function validateTransfer(data:any) {
  if(data?.format!=='vocab-p2-content'||data.version!==1||!data.body||!Array.isArray(data.body.content)||!Array.isArray(data.body.frequency)||data.sha256!==sha256(JSON.stringify(data.body))||data.counts?.content!==data.body.content.length||data.counts?.frequency!==data.body.frequency.length)throw new Error('invalid content header, version, count or sha256');
  for(const r of [...data.body.content,...data.body.frequency])if(typeof r.word_source!=='string'||typeof r.headword!=='string')throw new Error('invalid word identity');
  for(const r of data.body.content){if(!KINDS.includes(r.kind)||!r.body||typeof r.body!=='object'||(r.input_hash!==null&&typeof r.input_hash!=='string'))throw new Error('invalid content row');if(r.flags_json!==null&&!Array.isArray(JSON.parse(r.flags_json)))throw new Error('invalid flags');}
  for(const r of data.body.frequency)if(!['zk_high','daily_high'].includes(r.grp)||!Number.isInteger(r.rank)||r.rank<0||![0,1].includes(r.is_inferred)||typeof r.basis!=='string'||typeof r.source!=='string'||r.grp==='zk_high'&&r.is_inferred!==1)throw new Error('invalid frequency row');
  return data;
}
export function planImport(db:DB,input:any) {
  assertPhase2(db);const data=validateTransfer(input),operations:{table:'word_content'|'word_freq';wordId:number;row:any;update?:boolean}[]=[];const plan={added:0,existing:0,missing:0,conflicts:0};
  const seenContent=new Set<string>(),seenFreq=new Set<string>();
  for(const [table,rows] of [['word_content',data.body.content],['word_freq',data.body.frequency]] as const)for(const inputRow of rows){
    const row=table==='word_content'?{...inputRow,body_json:JSON.stringify(inputRow.body)}:inputRow;
    const word=db.prepare('SELECT id FROM words WHERE source=? AND headword=?').get(row.word_source,row.headword) as {id:number}|undefined;if(!word){plan.missing++;continue;}
    if(table==='word_content') {
      const key=JSON.stringify([word.id,row.kind,row.input_hash]);if(seenContent.has(key)){plan.existing++;continue;}seenContent.add(key);
      const existing=db.prepare('SELECT * FROM word_content WHERE word_id=? AND kind=? AND input_hash IS ?').get(word.id,row.kind,row.input_hash) as any;
      if(existing){plan.existing++;if(JSON.stringify(pick(existing,contentKeys))!==JSON.stringify(pick(row,contentKeys)))plan.conflicts++;continue;}
      operations.push({table,wordId:word.id,row});plan.added++;
    }else{
      const key=`${word.id}/${row.grp}`;if(seenFreq.has(key))throw new Error('duplicate frequency identity');seenFreq.add(key);
      const existing=db.prepare('SELECT * FROM word_freq WHERE word_id=? AND grp=?').get(word.id,row.grp) as any;
      if(existing&&JSON.stringify(pick(existing,freqKeys))===JSON.stringify(pick(row,freqKeys))){plan.existing++;continue;}
      if(existing)plan.conflicts++;else plan.added++;operations.push({table,wordId:word.id,row,update:!!existing});
    }
  }
  return {plan,operations};
}
export function applyImport(db:DB,input:any) {
  const {plan,operations}=planImport(db,input);let changes=0;
  db.transaction(()=>{for(const op of operations){const r=op.row;if(op.table==='word_content')changes+=db.prepare(`INSERT INTO word_content(word_id,status,${contentKeys.join(',')}) VALUES (?,'approved',${contentKeys.map(()=>'?').join(',')})`).run(op.wordId,...contentKeys.map(k=>r[k]??null)).changes;
    else changes+=db.prepare(`INSERT INTO word_freq(word_id,${freqKeys.join(',')},created_at) VALUES (?,${freqKeys.map(()=>'?').join(',')},?) ON CONFLICT(word_id,grp) DO UPDATE SET rank=excluded.rank,score=excluded.score,basis=excluded.basis,source=excluded.source,is_inferred=excluded.is_inferred`).run(op.wordId,...freqKeys.map(k=>r[k]??null),new Date().toISOString()).changes;
  }})();return {...plan,changes};
}
export async function importFile(file:string,input:any,opts:{yes?:boolean;backup?:string;home?:string}={}) {
  protectTarget(file,opts.home);validateTransfer(input);if(opts.yes&&!opts.backup)throw new Error('--yes requires --backup');
  if(opts.backup){protectTarget(opts.backup,opts.home);if(resolved(opts.backup)===resolved(file)||fs.existsSync(opts.backup))throw new Error('backup must be a new, different path');}
  const db=new Database(file,{readonly:!opts.yes,fileMustExist:true});try{const result=planImport(db,input);if(!opts.yes)return {...result.plan,changes:0};await db.backup(opts.backup!);return applyImport(db,input);}finally{db.close();}
}
export function exportFile(file:string,out:string,home?:string) {protectTarget(file,home);protectTarget(out,home);const db=new Database(file,{readonly:true,fileMustExist:true});try{const data=exportContent(db);fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');return data.counts;}finally{db.close();}}
