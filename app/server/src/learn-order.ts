import type { DB } from './db.ts';
import { setting } from './settings.ts';
export interface OrderWord { id:number; headword:string; meaning_zh:string|null; level:string|null; priority:number; freq_rank:number|null }
export function freshChoice(words: OrderWord[], n:number, every:number) {
  const secondary=every>0&&(n+1)%every===0;
  for(const p of secondary?[1,2,0]:[2,1,0]) {
    const found=words.filter(w=>w.priority===p).sort((a,b)=>(a.freq_rank??999999)-(b.freq_rank??999999)||a.id-b.id)[0];
    if(found)return found;
  }
}
export function freshWordId(db:DB) {
  const n=(db.prepare("SELECT COUNT(*) n FROM cards c JOIN words w ON w.id=c.word_id WHERE c.mode='recognize' AND w.priority>0").get() as {n:number}).n;
  const remaining=db.prepare("SELECT w.* FROM words w WHERE NOT EXISTS (SELECT 1 FROM cards c WHERE c.word_id=w.id AND c.mode='recognize')").all() as OrderWord[];
  return freshChoice(remaining,n,setting(db,'level2_every',5))?.id;
}
export function learnOrder(db:DB): OrderWord[] {
  const all=db.prepare('SELECT * FROM words').all() as OrderWord[];
  const cards=db.prepare("SELECT c.*, MIN(l.review_at) first_at FROM cards c LEFT JOIN review_logs l ON l.card_id=c.id WHERE c.mode='recognize' GROUP BY c.id").all() as {id:number;word_id:number;state:number;first_at:string|null}[];
  const byId=new Map(all.map(w=>[w.id,w]));
  const learned=cards.filter(c=>c.state!==0).sort((a,b)=>(a.first_at??'').localeCompare(b.first_at??'')||a.id-b.id);
  const pending=cards.filter(c=>c.state===0).sort((a,b)=>a.id-b.id);
  const result=[...learned,...pending].map(c=>byId.get(c.word_id)!).filter(Boolean);
  const occupied=new Set(cards.map(c=>c.word_id));
  let remaining=all.filter(w=>!occupied.has(w.id));
  let n=cards.filter(c=>(byId.get(c.word_id)?.priority??0)>0).length;
  while(remaining.length) {const w=freshChoice(remaining,n,setting(db,'level2_every',5));if(!w)break;result.push(w);if(w.priority>0)n++;remaining=remaining.filter(x=>x.id!==w.id);}
  return result.filter(w=>(w as OrderWord&{source:string}).source==='kb2022');
}
