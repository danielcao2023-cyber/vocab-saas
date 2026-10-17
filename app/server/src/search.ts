import type { DB } from './db.ts';
import { mainHeadwords, normalizeQuotes } from './text.ts';
import { wordStatus, statusKey } from './word-status.ts';
import { getContent } from './content.ts';
export interface WordRow {id:number;headword:string;phonetic:string|null;meaning_zh:string|null;level:string|null;state:number|null;stability:number|null;inWrongBook:number;[key:string]:unknown}
export function readWords(db:DB):WordRow[] {return db.prepare(`SELECT w.*, c.state,c.stability, EXISTS(SELECT 1 FROM wrong_words ww WHERE ww.word_id=w.id AND ww.removed_at IS NULL) inWrongBook FROM words w LEFT JOIN cards c ON c.word_id=w.id AND c.mode='recognize' ORDER BY w.id`).all() as WordRow[];}
export function summary(w:WordRow) {return {id:w.id,headword:w.headword,phonetic:w.phonetic,firstMeaning:(w.meaning_zh??'').split('\n')[0],level:w.level,status:wordStatus(w),inWrongBook:!!w.inWrongBook};}
export const FORM_LABELS:Record<string,string>={p:'过去式',d:'过去分词',i:'现在分词','3':'第三人称单数',s:'复数',r:'比较级',t:'最高级'};
export function search(db:DB,query:string,limit=20) {
  if([...query].length>40)throw new Error('q must be at most 40 characters');
  const q=normalizeQuotes(query).trim().toLowerCase();if(!q)return [];
  const chinese=/\p{Script=Han}/u.test(q);
  const forms=db.prepare('SELECT word_id,form,kind FROM word_forms').all() as {word_id:number;form:string;kind:string}[];
  return readWords(db).map(w=>{
    let rank=Infinity;let formMatch: {form:string;kind:string;description:string}|undefined;
    if(chinese) {const i=(w.meaning_zh??'').split('\n').findIndex(line=>line.toLowerCase().includes(q));if(i>=0)rank=i;}
    else {
      const variants=mainHeadwords(w.headword).map(x=>x.toLowerCase());
      rank=variants.includes(q)?0:variants.some(v=>v.startsWith(q))?1:variants.some(v=>v.includes(q))?2:Infinity;
      const f=forms.find(f=>f.word_id===w.id&&normalizeQuotes(f.form).toLowerCase()===q);
      if(f&&rank===Infinity){rank=3;formMatch={form:f.form,kind:f.kind,description:`${q} 是 ${variants[0]} 的${FORM_LABELS[f.kind]??'变化形式'}`};}
    }
    return {rank,w,formMatch};
  }).filter(x=>Number.isFinite(x.rank)).sort((a,b)=>a.rank-b.rank||a.w.id-b.w.id).slice(0,Math.max(1,Math.min(100,limit))).map(x=>({...summary(x.w),...(x.formMatch?{formMatch:x.formMatch}:{})}));
}
export function wordDetail(db:DB,id:number) {
  const w=readWords(db).find(w=>w.id===id);if(!w)return null;
  const cards=db.prepare('SELECT mode,state,due FROM cards WHERE word_id=?').all(id) as {mode:string;state:number;due:string}[];
  const wrong=db.prepare('SELECT removed_at,wrong_count,correct_days FROM wrong_words WHERE word_id=?').get(id) as {removed_at:string|null;wrong_count:number;correct_days:string}|undefined;
  const keys=['id','headword','phonetic','pos','meaning_zh','meaning_source','meaning_flag','level','source'];
  return {word:Object.fromEntries(keys.map(k=>[k,w[k]])),status:wordStatus(w),statusDetail:Object.fromEntries(['recognize','spell','dictation'].map(mode=>[mode,cards.find(c=>c.mode===mode)?{state:cards.find(c=>c.mode===mode)!.state,due:cards.find(c=>c.mode===mode)!.due}:null])),wrong:wrong?{inBook:wrong.removed_at===null,wrong_count:wrong.wrong_count,correct_days:JSON.parse(wrong.correct_days)}:null,content:getContent(db,id)};
}
export function browse(db:DB,q:Record<string,string|undefined>) {
  const group=q.group??'zk_high',level=q.level??'all',letter=q.letter??'all',status=q.status??'all';
  const page=Number(q.page??1),size=Number(q.size??50);
  if(!['zk_high','daily_high'].includes(group)||!['all','core','level2'].includes(level)||!['all',...'abcdefghijklmnopqrstuvwxyz'].includes(letter)||!['all','new','learning','familiar','mastered'].includes(status)||!Number.isInteger(page)||page<1||!Number.isInteger(size)||size<1||size>100)throw new Error('invalid browse parameters');
  const all=readWords(db).filter(w=>w.source==='kb2022');
  const ranks=db.prepare('SELECT * FROM word_freq WHERE grp=? AND rank>0').all(group) as {word_id:number;rank:number;basis:string;is_inferred:number}[];
  const byId=new Map(ranks.map(r=>[r.word_id,r]));
  const filtered=all.filter(w=>(level==='all'||w.level===(level==='core'?'三级':'二级'))&&(letter==='all'||mainHeadwords(w.headword)[0]?.[0]?.toLowerCase()===letter)&&(status==='all'||statusKey(w)===status)).sort((a,b)=>(byId.get(a.id)?.rank??Infinity)-(byId.get(b.id)?.rank??Infinity)||a.id-b.id);
  return {items:filtered.slice((page-1)*size,page*size).map(w=>({...summary(w),rank:byId.get(w.id)?.rank??null,basis:byId.get(w.id)?.basis??'',isInferred:!!byId.get(w.id)?.is_inferred})),total:filtered.length,page,size,group,coverage:{ranked:all.filter(w=>byId.has(w.id)).length,total:all.length}};
}
