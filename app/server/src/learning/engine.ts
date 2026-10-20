import {randomUUID} from 'node:crypto';
import {createEmptyCard,Rating} from 'ts-fsrs';
import type {DB} from '../db.ts';
import {acceptedSpellings,normalizeAnswer,review,type CardRow} from '../study.ts';
import {shDay,shDayStart} from '../time.ts';
import {maskAnswer} from '../text.ts';
import {meaningsOverlap} from '../quiz.ts';
import {recomputeDailyStats} from '../stats.ts';
import {HttpError} from '../http-error.ts';
import {learningWords,selectDaily,type LearningWord} from './selection.ts';
import type {WordBook,LearningMode,LearningSummary,LearningTurn,LearningCard,LearningAnswer,LearningResult,LearningBooks} from '../../../shared/learning.ts';
const MODES:LearningMode[]=['recognize','spell','dictation'];
interface DayWord {day:string;word_id:number;position:number;initial_book:WordBook;is_new:number;targets:string;streaks:string;errors:number;assisted:number;available_at:string;last_mode:number;done:number;deferred:number}
interface Issue {id:string;day:string;word_id:number;mode:LearningMode;options_json:string;issued_at:string;assisted:number;answered_at:string|null;answer_id:string|null;result_json:string|null}
const tomorrow=(now:Date)=>new Date(shDayStart(now).getTime()+86400000).toISOString();
const counts=(words:LearningWord[])=>words.reduce((r,w)=>(r[w.book]++,r),{new:0,unfamiliar:0,familiar:0,mastered:0});
const rows=(db:DB,day:string)=>db.prepare('SELECT * FROM learning_day_words WHERE day=? ORDER BY position').all(day) as DayWord[];
export function learningToday(db:DB,now=new Date()):LearningSummary{
 const day=shDay(now),started=!!db.prepare('SELECT 1 FROM learning_days WHERE day=?').get(day),items=rows(db,day),preview=selectDaily(db,now);
 const tally=db.prepare('SELECT COUNT(*) answers,COALESCE(SUM(json_extract(result_json,\'$.correct\')),0) correct FROM learning_issues WHERE day=? AND answered_at IS NOT NULL AND answer_id IS NOT NULL').get(day) as {answers:number;correct:number};
 const total=started?items.length:preview.selected.length,newWords=started?items.filter(w=>w.is_new).length:preview.selected.filter(w=>w.book==='new').length;
 const completed=items.filter(w=>w.done).length,deferred=items.filter(w=>w.deferred&&!w.done).length;
 return {day,started,total,completed,deferred,newWords,reviewWords:total-newWords,remaining:total-completed-deferred,backlog:preview.backlog,...tally,books:counts(learningWords(db))};
}
function ensureWord(db:DB,w:LearningWord,now:Date){
 db.prepare('INSERT OR IGNORE INTO learning_words(word_id,book,introduced_at,initial_done,initial_errors,due,last_fail) VALUES (?,?,?,?,?,?,?)').run(w.id,w.book,now.toISOString(),w.initial_done,w.initial_errors,w.due??now.toISOString(),w.last_fail);
 for(const mode of MODES){const c=createEmptyCard(now);db.prepare('INSERT OR IGNORE INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,learning_steps,reps,lapses,state) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(w.id,mode,c.due.toISOString(),c.stability,c.difficulty,c.elapsed_days,c.scheduled_days,c.learning_steps,c.reps,c.lapses,c.state);}
}
export function startLearning(db:DB,now=new Date()){
 db.transaction(()=>{const day=shDay(now);if(db.prepare('SELECT 1 FROM learning_days WHERE day=?').get(day))return;
  db.prepare('INSERT INTO learning_days(day,created_at) VALUES (?,?)').run(day,now.toISOString());
  selectDaily(db,now).selected.forEach((w,i)=>{
   ensureWord(db,w,now);let targets=[1,1,1];
   if(!w.initial_done)targets=[3,3,3];
   else if(w.book==='mastered'){
    const cards=db.prepare('SELECT mode,last_review,lapses,due FROM cards WHERE word_id=? ORDER BY due,COALESCE(last_review,\'\'),lapses DESC').all(w.id) as {mode:LearningMode}[];
    targets=[0,0,0];targets[MODES.indexOf(cards[0].mode)]=1;
   }
   db.prepare('INSERT INTO learning_day_words(day,word_id,position,initial_book,is_new,targets,available_at) VALUES (?,?,?,?,?,?,?)').run(day,w.id,i,w.book,Number(w.book==='new'),JSON.stringify(targets),now.toISOString());
  });
 })();return learningToday(db,now);
}
function optionsFor(db:DB,w:LearningWord){
 const options=[{id:w.id,text:(w.meaning_zh??'').split('\n')[0]}];
 for(const other of learningWords(db).filter(x=>x.id!==w.id)){
  if(options.length>=4)break;
  const meaning=(other.meaning_zh??'').split('\n')[0];if(!meaning||options.some(o=>meaningsOverlap(o.text,meaning)))continue;
  options.push({id:other.id,text:meaning});
 }
 for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
 return [...options,{id:0,text:'不记得'}];
}
function renderCard(db:DB,issue:Issue,w:LearningWord):LearningCard{
 const patterns=[...new Set(acceptedSpellings(w.headword).map(h=>h.replace(/[A-Za-z]/g,'_')))];
 return {issueId:issue.id,wordId:w.id,mode:issue.mode,patterns,assisted:!!issue.assisted,options:issue.mode==='recognize'?JSON.parse(issue.options_json):[],
  ...(issue.mode==='recognize'?{headword:w.headword}:issue.mode==='spell'?{meaning:maskAnswer(w.meaning_zh,w.headword),meaning_source:w.meaning_source??null}:{audioWord:acceptedSpellings(w.headword)[0]})};
}
export function nextLearning(db:DB,now=new Date()):LearningTurn{return db.transaction(()=>{
 const summary=learningToday(db,now);if(!summary.started)return {kind:'idle',summary};
 const active=rows(db,summary.day).filter(w=>!w.done&&!w.deferred);if(!active.length)return {kind:'done',summary};
 const words=learningWords(db),byId=new Map(words.map(w=>[w.id,w]));
 const open=db.prepare('SELECT * FROM learning_issues WHERE day=? AND answered_at IS NULL ORDER BY issued_at DESC LIMIT 1').get(summary.day) as Issue|undefined;
 if(open&&active.some(w=>w.word_id===open.word_id))return {kind:'card',summary,card:renderCard(db,open,byId.get(open.word_id)!)};
 const eligible=active.filter(w=>w.available_at<=now.toISOString()).sort((a,b)=>a.available_at.localeCompare(b.available_at)||a.position-b.position);
 if(!eligible.length)return {kind:'waiting',summary,nextAt:active.map(w=>w.available_at).sort()[0]};
 const entry=eligible[0],targets=JSON.parse(entry.targets) as number[],streaks=JSON.parse(entry.streaks) as number[];
 const modes=MODES.map((mode,i)=>({mode,i})).filter(({i})=>streaks[i]<targets[i]);
 modes.sort((a,b)=>streaks[a.i]-streaks[b.i]||Number(a.i===entry.last_mode)-Number(b.i===entry.last_mode)||a.i-b.i);
 const mode=modes[0].mode,w=byId.get(entry.word_id)!,id=randomUUID(),options=mode==='recognize'?optionsFor(db,w):[];
 db.prepare('INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES (?,?,?,?,?,?)').run(id,summary.day,w.id,mode,JSON.stringify(options),now.toISOString());
 const issue=db.prepare('SELECT * FROM learning_issues WHERE id=?').get(id) as Issue;
 return {kind:'card',summary,card:renderCard(db,issue,w)};
})() as LearningTurn;}
function activeIssue(db:DB,id:unknown,now:Date){
 if(typeof id!=='string'||id.length>80)throw new HttpError(400,'题目编号无效。');
 const issue=db.prepare('SELECT * FROM learning_issues WHERE id=?').get(id) as Issue|undefined;
 if(!issue)throw new HttpError(404,'题目不存在，请重新开始。');
 if(issue.answered_at||issue.day!==shDay(now))throw new HttpError(409,'题目已更新，请返回今日任务继续。');
 const entry=db.prepare('SELECT * FROM learning_day_words WHERE day=? AND word_id=?').get(issue.day,issue.word_id) as DayWord;
 if(entry.done||entry.deferred)throw new HttpError(409,'这个词的本轮练习已结束。');return {issue,entry};
}
export function consultLearning(db:DB,id:unknown,now=new Date()){
 const {issue}=activeIssue(db,id,now);db.prepare('UPDATE learning_issues SET assisted=1 WHERE id=?').run(issue.id);return {ok:true};
}
export function deferLearning(db:DB,id:unknown,now=new Date()){
 return db.transaction(()=>{const {issue}=activeIssue(db,id,now);if(issue.mode!=='dictation')throw new HttpError(400,'只能暂缓无法播放的听写。');
  db.prepare('UPDATE learning_day_words SET deferred=1 WHERE day=? AND word_id=?').run(issue.day,issue.word_id);
  db.prepare('UPDATE learning_issues SET answered_at=? WHERE id=?').run(now.toISOString(),issue.id);
  db.prepare('UPDATE learning_words SET due=? WHERE word_id=?').run(tomorrow(now),issue.word_id);return {ok:true};
 })();
}
export function answerLearning(db:DB,input:LearningAnswer,now=new Date()):LearningResult{return db.transaction(()=>{
 if(!input||typeof input.answerId!=='string'||!input.answerId.trim()||input.answerId.length>100)throw new HttpError(400,'提交编号无效。');
 const replay=db.prepare('SELECT * FROM learning_issues WHERE answer_id=?').get(input.answerId) as Issue|undefined;
 if(replay){if(replay.id!==input.issueId)throw new HttpError(409,'提交编号已经使用。');return JSON.parse(replay.result_json!);}
 if(db.prepare('SELECT 1 FROM review_logs WHERE answer_id=?').get(input.answerId))throw new HttpError(409,'提交编号已经使用。');
 const {issue,entry}=activeIssue(db,input.issueId,now),w=learningWords(db).find(w=>w.id===issue.word_id)!;
 if(input.durationMs!==undefined&&(!Number.isFinite(input.durationMs)||input.durationMs<0||input.durationMs>300000))throw new HttpError(400,'答题时长无效。');
 let correct:boolean;
 if(issue.mode==='recognize'){
  const options=JSON.parse(issue.options_json) as {id:number}[];
  if(!Number.isSafeInteger(input.choiceId)||!options.some(o=>o.id===input.choiceId))throw new HttpError(400,'请选择题目提供的答案。');
  correct=input.choiceId===issue.word_id;
 }else{
  if(typeof input.answer!=='string'||!input.answer.trim()||input.answer.length>256)throw new HttpError(400,'请输入英文单词。');
  correct=acceptedSpellings(w.headword).includes(normalizeAnswer(input.answer));
 }
 const assisted=!!issue.assisted,errors=(w.error_day===issue.day?w.day_errors:0)+Number(!correct),initialErrors=w.initial_errors+Number(!w.initial_done&&(!correct||assisted));
 const targets=JSON.parse(entry.targets) as number[],streaks=JSON.parse(entry.streaks) as number[],i=MODES.indexOf(issue.mode);
 if(correct&&!assisted)streaks[i]++;else{streaks[i]=0;targets[i]=Math.max(3,targets[i]);}
 const finished=targets.every((n,index)=>streaks[index]>=n),wasAssisted=!!entry.assisted||assisted;
 let book:WordBook=w.book==='new'?'unfamiliar':w.book;
 if(!correct||assisted)book=errors>=2?'unfamiliar':w.book==='mastered'?'familiar':book;
 if(finished){
  if(errors>=2)book='unfamiliar';else if(errors||wasAssisted)book='familiar';
  else if(!w.initial_done)book=initialErrors===0?'mastered':'familiar';
  else book=entry.initial_book==='unfamiliar'?'familiar':'mastered';
 }
 const card=db.prepare('SELECT * FROM cards WHERE word_id=? AND mode=?').get(w.id,issue.mode) as CardRow;
 const rated=review(db,card.id,correct?(assisted?Rating.Hard:Rating.Good):Rating.Again,now,{answerId:input.answerId,correct,answer:input.answer,context:'study',qtype:issue.mode==='recognize'?'flip':issue.mode,durationMs:input.durationMs});
 const gap=correct&&!assisted?(streaks[i]>=2?15:5):3,available=new Date(now.getTime()+gap*60000).toISOString();
 let due=available;
 if(finished){
  const earliest=(db.prepare('SELECT MIN(due) due FROM cards WHERE word_id=?').get(w.id) as {due:string}).due;
  due=earliest<tomorrow(now)?tomorrow(now):earliest;
  if(!w.initial_done||(!correct)||errors>=2||(w.last_fail&&issue.day<shDay(new Date(new Date(w.last_fail).getTime()+2*86400000))))due=tomorrow(now);
 }
 db.prepare('UPDATE learning_day_words SET targets=?,streaks=?,errors=errors+?,assisted=?,available_at=?,last_mode=?,done=? WHERE day=? AND word_id=?').run(JSON.stringify(targets),JSON.stringify(streaks),Number(!correct),Number(wasAssisted),available,i,Number(finished),issue.day,w.id);
 db.prepare('UPDATE learning_words SET book=?,last_at=?,initial_done=?,initial_errors=?,error_day=?,day_errors=?,last_fail=?,due=? WHERE word_id=?').run(book,now.toISOString(),Number(!!w.initial_done||finished),initialErrors,issue.day,errors,!correct?now.toISOString():w.last_fail,due,w.id);
 const result:LearningResult={correct,assisted,expected:w.headword,meaning:w.meaning_zh??'',book,nextDue:due,previousBook:w.book};
 db.prepare('UPDATE learning_issues SET answered_at=?,answer_id=?,result_json=? WHERE id=?').run(now.toISOString(),input.answerId,JSON.stringify(result),issue.id);
 recomputeDailyStats(db,[issue.day]);
 void rated;return result;
})() as LearningResult;}
export function learningBooks(db:DB,book:WordBook,page=1,now=new Date()):LearningBooks{
 if(!['new','unfamiliar','familiar','mastered'].includes(book)||!Number.isSafeInteger(page)||page<1)throw new HttpError(400,'单词本或页码无效。');
 const words=learningWords(db),filtered=words.filter(w=>w.book===book).sort((a,b)=>(a.due??'').localeCompare(b.due??'')||a.id-b.id),size=40;void now;
 return {book,counts:counts(words),items:filtered.slice((page-1)*size,page*size).map(w=>({id:w.id,headword:w.headword,meaning:w.meaning_zh??'',phonetic:w.phonetic,level:w.level,book:w.book,due:w.due})),total:filtered.length,page,size};
}
