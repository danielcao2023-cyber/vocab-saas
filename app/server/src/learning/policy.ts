import type {DB} from '../db.ts';
import {shDay,shDayStart} from '../time.ts';
import {recomputeDailyStats} from '../stats.ts';
import {learningWords,type LearningWord} from './selection.ts';
import type {LearningMode,WordBook} from '../../../shared/learning.ts';
import {hasDictionaryPlaceholder} from '../text.ts';
export const MODES:LearningMode[]=['recognize','spell','dictation'];
export const POLICY_VERSION=2;
export const nextDay=(now:Date)=>new Date(shDayStart(now).getTime()+86400000).toISOString();
/** A clean day is independent success, without any error/help on that word that day. */
function cleanChecks(db:DB,w:LearningWord,day:string){
 return db.prepare(`SELECT DISTINCT i.day,i.mode FROM learning_issues i
 JOIN learning_day_words d ON d.day=i.day AND d.word_id=i.word_id
 WHERE i.word_id=? AND i.day>? AND i.day<=? AND i.answer_id IS NOT NULL
 AND json_extract(i.result_json,'$.correct')=1 AND i.assisted=0 AND d.errors=0 AND d.assisted=0`).all(w.id,w.last_fail?shDay(new Date(w.last_fail)):'',day) as {day:string;mode:LearningMode}[];
}
export function passBook(db:DB,w:LearningWord,day:string,mode:LearningMode,errors:number,assisted:boolean):WordBook{
 if(errors>=2)return 'unfamiliar';
 if(errors||assisted)return 'familiar';
 if(w.book==='mastered')return 'mastered';
 const checks=cleanChecks(db,w,day),days=new Set([...checks.map(c=>c.day),day]),modes=new Set([...checks.map(c=>c.mode),mode]);
 return days.size>=3&&modes.size===3?'mastered':'familiar';
}
export function chooseMode(db:DB,w:LearningWord,day:string,position:number):LearningMode{
 if(hasDictionaryPlaceholder(w.headword))return 'recognize';
 const cards=db.prepare("SELECT mode FROM cards WHERE word_id=? ORDER BY due,COALESCE(last_review,''),lapses DESC").all(w.id) as {mode:LearningMode}[];
 if(w.book==='mastered')return cards[0]?.mode??'recognize';
 const seen=new Set(cleanChecks(db,w,day).map(c=>c.mode));
 const offset=(Math.floor(Date.parse(day+'T00:00:00Z')/86400000)+position)%3;
 const mixed=[0,1,2].map(i=>MODES[(offset+i)%3]);
 return mixed.find(mode=>!seen.has(mode))??cards[0]?.mode??mixed[0];
}
/** Upgrade only the active day's old plan, keeping its words, logs and original answer results. */
export function upgradePlan(db:DB,now:Date){
 const day=shDay(now),plan=db.prepare('SELECT policy_version FROM learning_days WHERE day=?').get(day) as {policy_version:number}|undefined;
 if(!plan||plan.policy_version>=POLICY_VERSION)return;
 db.transaction(()=>{
  const words=new Map(learningWords(db).map(w=>[w.id,w]));
  const entries=db.prepare('SELECT * FROM learning_day_words WHERE day=? ORDER BY position').all(day) as {word_id:number;position:number;done:number;deferred:number;errors:number;assisted:number}[];
  for(const entry of entries){
   const w=words.get(entry.word_id);if(!w)continue;
   const last=db.prepare('SELECT mode,assisted,result_json FROM learning_issues WHERE day=? AND word_id=? AND answer_id IS NOT NULL ORDER BY issued_at DESC,rowid DESC LIMIT 1').get(day,w.id) as {mode:LearningMode;assisted:number;result_json:string}|undefined;
   const passed=!!entry.done||!!(last&&!last.assisted&&JSON.parse(last.result_json).correct);
   if(entry.deferred&&!passed)continue;
   const open=db.prepare('SELECT mode FROM learning_issues WHERE day=? AND word_id=? AND answered_at IS NULL LIMIT 1').get(day,w.id) as {mode:LearningMode}|undefined;
   const mode=passed&&last?last.mode:open?.mode??last?.mode??chooseMode(db,w,day,entry.position),targets=MODES.map(m=>Number(m===mode)),streaks=targets.map(n=>passed?n:0);
   db.prepare('UPDATE learning_day_words SET targets=?,streaks=?,done=?,deferred=0,available_at=? WHERE day=? AND word_id=?').run(JSON.stringify(targets),JSON.stringify(streaks),Number(passed),now.toISOString(),day,w.id);
   if(passed){
    const book=entry.errors>=2?'unfamiliar':w.book==='mastered'&&!entry.errors&&!entry.assisted?'mastered':'familiar';
    db.prepare('UPDATE learning_words SET book=?,initial_done=1,due=? WHERE word_id=?').run(book,w.due&&w.due>nextDay(now)?w.due:nextDay(now),w.id);
    db.prepare('UPDATE learning_issues SET answered_at=? WHERE day=? AND word_id=? AND answered_at IS NULL').run(now.toISOString(),day,w.id);
   }
  }
  db.prepare('UPDATE learning_days SET policy_version=? WHERE day=?').run(POLICY_VERSION,day);
  recomputeDailyStats(db,[day]);
 })();
}
