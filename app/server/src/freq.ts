import fs from 'node:fs';
import { createHash } from 'node:crypto';
import type { DB } from './db.ts';
import { parseCsvLine, quotesOpen } from './csv.ts';
import { mainHeadwords } from './text.ts';
export const sha256=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
export function readEcdict(file:string) {
  if(!file||!fs.existsSync(file))throw new Error('--ecdict requires an existing CSV file');
  const bytes=fs.readFileSync(file),lines=bytes.toString('utf8').replace(/^\uFEFF/,'').split(/\r?\n/);const header=parseCsvLine(lines.shift()??'');
  if(!['word','exchange','frq','bnc'].every(k=>header.includes(k)))throw new Error('invalid ECDICT CSV header');
  const rows=new Map<string,Record<string,string>>();let record='';
  for(const line of lines){record+= (record?'\n':'')+line;if(quotesOpen(record))continue;if(record){const cells=parseCsvLine(record),row=Object.fromEntries(header.map((k,i)=>[k,cells[i]??'']));rows.set(row.word.toLowerCase(),row);}record='';}
  if(record)throw new Error('unclosed CSV record');return {rows,hash:sha256(bytes).slice(0,12)};
}
export function importForms(db:DB,file:string) {
  const {rows}=readEcdict(file);let changes=0;
  db.transaction(()=>{for(const w of db.prepare("SELECT id,headword FROM words WHERE source='kb2022'").all() as {id:number;headword:string}[]){const h=mainHeadwords(w.headword)[0]?.toLowerCase();if(!h||/\s/.test(h))continue;for(const entry of (rows.get(h)?.exchange??'').split('/')){const [kind,values]=entry.split(':');if(!['p','d','i','3','s','r','t','0','1'].includes(kind)||!values)continue;for(const form of values.split(',')){if(!form.trim())continue;changes+=db.prepare('INSERT OR IGNORE INTO word_forms(word_id,form,kind) VALUES (?,?,?)').run(w.id,form.trim().toLowerCase(),kind).changes;}}}})();return {changes};
}
export function dailyFrequency(db:DB,file:string) {
  const {rows,hash}=readEcdict(file);
  const words=(db.prepare("SELECT id,headword FROM words WHERE source='kb2022'").all() as {id:number;headword:string}[]).map(w=>{const row=rows.get(mainHeadwords(w.headword)[0]?.toLowerCase());const frq=Number(row?.frq),bnc=Number(row?.bnc);const score=frq>0?frq:bnc>0?bnc:null;return {...w,score,basis:frq>0?`COCA 词频第 ${frq} 位（ECDICT frq）`:bnc>0?`BNC 词频第 ${bnc} 位（ECDICT bnc，COCA 无数据）`:'词频库无数据，排在最后（推断）'};}).sort((a,b)=>(a.score??Infinity)-(b.score??Infinity)||a.id-b.id);
  db.transaction(()=>{words.forEach((w,i)=>db.prepare(`INSERT INTO word_freq(word_id,grp,rank,score,basis,source,is_inferred,created_at) VALUES (?,'daily_high',?,?,?,?,?,?) ON CONFLICT(word_id,grp) DO UPDATE SET rank=excluded.rank,score=excluded.score,basis=excluded.basis,source=excluded.source,is_inferred=excluded.is_inferred`).run(w.id,i+1,w.score,w.basis,`ecdict-frq@${hash}`,w.score===null?1:0,new Date().toISOString()));})();return {ranked:words.length};
}
export function rankZk(db:DB) {
  const total=(db.prepare("SELECT COUNT(*) n FROM words WHERE source='kb2022'").get() as {n:number}).n;
  const rows=db.prepare("SELECT f.word_id FROM word_freq f JOIN words w ON w.id=f.word_id LEFT JOIN word_freq d ON d.word_id=f.word_id AND d.grp='daily_high' WHERE f.grp='zk_high' AND w.source='kb2022' ORDER BY f.score DESC,COALESCE(d.rank,999999),w.id").all() as {word_id:number}[];
  if(rows.length!==total)throw new Error('zk_freq scores incomplete; rank only after all words are scored');
  db.transaction(()=>rows.forEach((w,i)=>db.prepare("UPDATE word_freq SET rank=? WHERE word_id=? AND grp='zk_high'").run(i+1,w.word_id)))();return {ranked:rows.length};
}
