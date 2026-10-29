import {dedupeDayGroup,dedupeTofuDayGroup,dedupeHighschoolVariants} from './day-groups.ts';
import type {DB} from '../db.ts';
import type {WordBook} from '../../../shared/learning.ts';
import {selectedWordIds} from '../vocabulary-selection.ts';
export interface LearningWord {id:number;headword:string;meaning_zh:string|null;phonetic:string|null;level:string|null;priority:number;freq_rank:number|null;source:string;meaning_source?:string|null;book:WordBook;due:string|null;initial_done:number;initial_errors:number;introduced_at:string|null;last_fail:string|null;day_errors:number;error_day:string;}
export function learningWords(db:DB,now=new Date(),includeAll=false):LearningWord[]{const ids=includeAll?null:selectedWordIds(db,now);return (db.prepare(`SELECT w.*,COALESCE(l.book,CASE WHEN c.state IS NULL OR c.state=0 THEN 'new' WHEN c.state IN (1,3) OR c.stability<7 THEN 'unfamiliar' WHEN c.stability<21 THEN 'familiar' ELSE 'mastered' END) book,
 COALESCE(l.due,(SELECT MIN(due) FROM cards WHERE word_id=w.id AND state<>0)) due,
 COALESCE(l.initial_done,CASE WHEN c.state>0 THEN 1 ELSE 0 END) initial_done,
 COALESCE(l.initial_errors,0) initial_errors,l.introduced_at,l.last_fail,COALESCE(l.day_errors,0) day_errors,COALESCE(l.error_day,'') error_day
 FROM words w LEFT JOIN learning_words l ON l.word_id=w.id LEFT JOIN cards c ON c.word_id=w.id AND c.mode='recognize'
 ORDER BY w.id`).all() as LearningWord[]).filter(w=>!ids||ids.has(w.id));}
export function wordDifficulty(headword:string){const h=headword.replace(/\(.*?\)|（.*?）/g,'').split('/')[0].trim();const n=h.replace(/[^A-Za-z]/g,'').length;return n<=5&&!/[ '-]/.test(h)?0:n>=10||h.includes(' ')?2:1;}
/** Composition affects new words only; overdue review always wins. */
export function selectDaily(db:DB,now:Date,limit=40){
 const words=learningWords(db,now),unfinished=new Set((db.prepare('SELECT d.word_id FROM learning_day_words d WHERE d.done=0 AND d.day<? AND d.day=(SELECT MAX(x.day) FROM learning_day_words x WHERE x.word_id=d.word_id)').all(new Date(now.getTime()+8*3600000).toISOString().slice(0,10)) as {word_id:number}[]).map(r=>r.word_id));
 const due=words.filter(w=>unfinished.has(w.id)||(w.book!=='new'&&(!w.due||w.due<=now.toISOString())));
 due.sort((a,b)=>Number(unfinished.has(b.id))-Number(unfinished.has(a.id))||Number(b.book==='unfamiliar')-Number(a.book==='unfamiliar')||(a.due??'').localeCompare(b.due??'')||b.day_errors-a.day_errors||a.id-b.id);
 const fresh=words.filter(w=>w.book==='new'&&!unfinished.has(w.id)),firstGroup=dedupeDayGroup(db,now,words,due,fresh),tofuGroup=dedupeTofuDayGroup(db,now,words,firstGroup.due,firstGroup.fresh),grouped=dedupeHighschoolVariants(db,now,words,tofuGroup.due,tofuGroup.fresh);
 const selected=grouped.due.slice(0,limit);
 selected.push(...composeFresh(grouped.fresh,limit-selected.length));
 return {selected,backlog:Math.max(0,grouped.due.length-limit)};
}

export function composeFresh(input:LearningWord[],limit:number){const fresh=[...input],selected:LearningWord[]=[],needed=Math.min(limit,fresh.length);let core=0;const buckets=[0,0,0];
 for(let i=0;i<needed;i++){
  const coreTarget=Math.round((i+1)*.7),isCore=core<coreTarget;
  let pool=fresh.filter(w=>(w.priority===2)===isCore);if(!pool.length)pool=fresh;
  const desired=[.4,.4,.2].map((ratio,j)=>ratio*(i+1)-buckets[j]);const category=desired.indexOf(Math.max(...desired));
  const matching=pool.filter(w=>wordDifficulty(w.headword)===category);if(matching.length)pool=matching;
  pool.sort((a,b)=>(a.freq_rank||999999)-(b.freq_rank||999999)||a.id-b.id);
  const word=pool[0];selected.push(word);if(word.priority===2)core++;buckets[wordDifficulty(word.headword)]++;fresh.splice(fresh.indexOf(word),1);
 }
 return selected;
}
