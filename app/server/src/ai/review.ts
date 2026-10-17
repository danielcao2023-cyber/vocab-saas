import fs from 'node:fs';
import path from 'node:path';
import type { DB } from '../db.ts';
import { parseCsvLine,quotesOpen } from '../csv.ts';
export function reviewRows(db:DB,filter:{job?:number;since?:string}={}) {return db.prepare(`SELECT c.*,w.headword,w.meaning_zh,w.meaning_source FROM word_content c JOIN words w ON w.id=c.word_id WHERE (? IS NULL OR c.job_id=?) AND (? IS NULL OR c.created_at>=?) AND c.hidden_at IS NULL ORDER BY c.word_id,c.id`).all(filter.job??null,filter.job??null,filter.since??null,filter.since??null) as any[];}
export function sampleRows(db:DB,filter:{job?:number;since?:string;seed?:number}={}) {
  const rows=reviewRows(db,filter);let state=filter.seed??20261017;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const choose=<T,>(xs:T[],ratio:number)=>[...xs].map(x=>({x,r:random()})).sort((a,b)=>a.r-b.r).slice(0,Math.ceil(xs.length*ratio)).map(x=>x.x);
  const ids=[...new Set(rows.map(r=>r.word_id))];const words=new Set(choose(ids,.05));
  const special=ids.filter(id=>rows.some(r=>r.word_id===id&&(r.meaning_source==='manual'||(r.meaning_zh??'').split('\n').length>=3)));choose(special,.2).forEach(id=>words.add(id));
  const selected=new Set<number>(rows.filter(r=>words.has(r.word_id)).map(r=>r.id));
  // Only a recorded, sufficiently large etymology audit at <=2% error allows reduced sampling.
  const ety=db.prepare("SELECT * FROM word_content WHERE kind='mnemonic_etymology' ORDER BY id").all() as any[];
  const firstWords=new Set([...new Set(ety.map(r=>r.word_id))].slice(0,200));
  const audited=ety.filter(r=>firstWords.has(r.word_id)&&(r.approved_at||r.hidden_reason&& !r.hidden_reason.startsWith('feedback:')));
  const initial=ety.filter(r=>firstWords.has(r.word_id));
  const safe=firstWords.size>=200&&initial.length===audited.length&&audited.filter(r=>r.hidden_at).length/audited.length<=.02;
  for(const job of [...new Set(rows.map(r=>r.job_id))]){
    const batch=rows.filter(r=>r.job_id===job);
    const etymologies=batch.filter(r=>r.kind==='mnemonic_etymology');for(const r of safe?choose(etymologies.filter(r=>!firstWords.has(r.word_id)),.2):etymologies)selected.add(r.id);
    for(const r of etymologies.filter(r=>firstWords.has(r.word_id)))selected.add(r.id);
    for(const kind of ['synonym','antonym'])for(const r of choose(batch.filter(r=>r.kind===kind),.1))selected.add(r.id);
    for(const r of choose(batch.filter(r=>r.downgraded_from),.1))selected.add(r.id);
  }
  for(const r of rows){const flags=JSON.parse(r.flags_json??'[]') as string[];if(flags.some(f=>f.startsWith('outside_list'))||r.kind==='example'&&flags.includes('hard_word'))selected.add(r.id);}
  return rows.filter(r=>selected.has(r.id));
}
const csvCell=(v:unknown)=>'"'+String(v??'').replace(/"/g,'""')+'"';
export function writeSample(db:DB,directory:string,filter:{job?:number;since?:string;seed?:number}={}) {
  const seed=filter.seed??20261017,rows=sampleRows(db,{...filter,seed});fs.mkdirSync(directory,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');const base=path.join(directory,stamp);
  const headers=['word_id','词','kind','content_id','内容','判定','错误类型','核对来源','日期'];
  const cells=rows.map(r=>[r.word_id,r.headword,r.kind,r.id,r.body_json,'','','','']);
  fs.writeFileSync(base+'.csv',headers.join(',')+'\n'+cells.map(row=>row.map(csvCell).join(',')).join('\n')+'\n');
  fs.writeFileSync(base+'.md',`# AI 内容抽查\n\n固定种子：${seed}\n\n|${headers.join('|')}|\n|${headers.map(()=> '---').join('|')}|\n`+cells.map(row=>'|'+row.map(x=>String(x).replace(/\|/g,'／').replace(/\n/g,' ')).join('|')+'|').join('\n'));return {seed,rows:rows.length,markdown:base+'.md',csv:base+'.csv'};
}
export function applySheet(db:DB,text:string,yes=false) {
  const records:string[][]=[];let pending='';for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){pending+=(pending?'\n':'')+line;if(quotesOpen(pending))continue;if(pending)records.push(parseCsvLine(pending));pending='';}if(pending)throw new Error('unclosed CSV');
  const headers=records.shift()??[];for(const col of ['content_id','判定','错误类型'])if(!headers.includes(col))throw new Error('invalid review sheet');
  const plan=records.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??'']))).filter(r=>['对','错'].includes(r['判定'])).map(r=>({id:Number(r.content_id),verdict:r['判定'],reason:r['错误类型']||'review:incorrect'}));
  for(const r of plan)if(!Number.isInteger(r.id)||!db.prepare('SELECT 1 FROM word_content WHERE id=?').get(r.id))throw new Error('unknown content_id');
  if(yes)db.transaction(()=>{for(const r of plan){if(r.verdict==='错')db.prepare('UPDATE word_content SET hidden_at=?,hidden_reason=? WHERE id=?').run(new Date().toISOString(),r.reason,r.id);else db.prepare("UPDATE word_content SET status='approved',approved_at=?,reviewed=1 WHERE id=? AND hidden_at IS NULL").run(new Date().toISOString(),r.id);}})();return {plan,written:yes?plan.length:0};
}
export function approveJob(db:DB,job:number,yes=false) {const rows=db.prepare("SELECT id FROM word_content WHERE job_id=? AND status='generated' AND hidden_at IS NULL").all(job);if(yes)db.prepare("UPDATE word_content SET status='approved',approved_at=? WHERE job_id=? AND status='generated' AND hidden_at IS NULL").run(new Date().toISOString(),job);return {planned:rows.length,written:yes?rows.length:0};}
export function hideContent(db:DB,id:number,reason:string,yes=false) {if(!reason.trim()||!db.prepare('SELECT 1 FROM word_content WHERE id=?').get(id))throw new Error('valid content and reason required');if(yes)db.prepare('UPDATE word_content SET hidden_at=?,hidden_reason=? WHERE id=?').run(new Date().toISOString(),reason,id);return {id,reason,written:yes?1:0};}
export function reviewStats(db:DB){return {states:db.prepare('SELECT status,COUNT(*) n FROM word_content GROUP BY status').all(),kinds:db.prepare('SELECT kind,status,COUNT(*) n FROM word_content GROUP BY kind,status').all(),coverage:{approvedWords:(db.prepare("SELECT COUNT(DISTINCT c.word_id) n FROM word_content c JOIN words w ON w.id=c.word_id WHERE c.status='approved' AND c.hidden_at IS NULL AND w.source='kb2022'").get() as {n:number}).n,total:1600}};}
