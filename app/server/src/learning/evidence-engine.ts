import {randomUUID} from 'node:crypto';
import type {DB} from '../db.ts';
import {HttpError} from '../http-error.ts';
import {acceptedSpellings,normalizeAnswer} from '../study.ts';
import {shDay} from '../time.ts';
import {maskAnswer,hasDictionaryPlaceholder} from '../text.ts';
import {meaningsOverlap} from '../quiz.ts';
import {recomputeDailyStats} from '../stats.ts';
import {dailyWordLimit} from '../user-settings.ts';
import type {LearningMode,LearningCard,LearningAnswer,LearningResultV3,LearningSummaryV3,LearningTurnV3,CapabilityNeed,ConsultInput,WordBook} from '../../../shared/learning.ts';
import {learningWords,composeFresh,type LearningWord} from './selection.ts';
import {nextDay,MODES} from './policy.ts';
import {REVIEW_POLICY,classifyEvidence,chooseCapability} from './evidence-policy.ts';
import {ensureEvidenceWord,evidenceCards,latestExposure,readWordEvidence,saveProbe,saveExposure,recordCorrection,projectEvidence,capabilityNeeds,evidenceIndex,untouchedEvidence} from './evidence-store.ts';
import {legacyIssueHeadword} from './legacy-issue.ts';
interface Entry {day:string;word_id:number;position:number;is_new:number;last_mode:number;done:number;deferred:number;available_at:string}
interface Issue {id:string;day:string;word_id:number;mode:LearningMode;options_json:string;issued_at:string;assisted:number;answered_at:string|null;answer_id:string|null;result_json:string|null}
const entries=(db:DB,day:string)=>db.prepare('SELECT * FROM learning_day_words WHERE day=? ORDER BY position').all(day) as Entry[];
const probeCount=(db:DB,wordId:number,day:string)=>(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE word_id=? AND eligible=1 AND source='live' AND substr(datetime(occurred_at,'+8 hours'),1,10)=?").get(wordId,day) as any).n as number;
const hasSuccess=(db:DB,wordId:number,day:string)=>!!db.prepare("SELECT 1 FROM learning_events WHERE word_id=? AND kind='probe_success' AND source='live' AND substr(datetime(occurred_at,'+8 hours'),1,10)=?").get(wordId,day);
export {capabilityNeeds} from './evidence-store.ts';

function selection(db:DB,now:Date){
 const words=learningWords(db,now),day=shDay(now),unfinished=new Set((db.prepare('SELECT d.word_id FROM learning_day_words d WHERE d.day<? AND d.done=0 AND d.day=(SELECT MAX(x.day) FROM learning_day_words x WHERE x.word_id=d.word_id)').all(day) as any[]).map(r=>r.word_id));
 const due=words.filter(w=>unfinished.has(w.id)||!!w.introduced_at&&capabilityNeeds(db,w.id,now).some(n=>n.group!=='initial'&&n.dueAt<=now.toISOString())||!!w.introduced_at&&readWordEvidence(db,w.id,now).stage!=='new'&&capabilityNeeds(db,w.id,now).some(n=>n.dueAt<=now.toISOString()));
 due.sort((a,b)=>Number(unfinished.has(b.id))-Number(unfinished.has(a.id))||Number(readWordEvidence(db,b.id,now).priority)-Number(readWordEvidence(db,a.id,now).priority)||(readWordEvidence(db,a.id,now).dueAt??'').localeCompare(readWordEvidence(db,b.id,now).dueAt??'')||a.id-b.id);
 const limit=dailyWordLimit(db,now),selected=due.slice(0,limit),ids=new Set(selected.map(w=>w.id));
 selected.push(...composeFresh(words.filter(w=>!ids.has(w.id)&&!w.introduced_at),limit-selected.length));
 return {selected,backlog:Math.max(0,due.length-limit)};
}
function needFor(db:DB,e:Entry,now:Date){
 let needs=capabilityNeeds(db,e.word_id,now);
 if(probeCount(db,e.word_id,e.day)>0&&!hasSuccess(db,e.word_id,e.day)&&e.last_mode>=0)needs=needs.filter(n=>n.mode===MODES[e.last_mode]);
 return {needs,ready:chooseCapability(needs.map(n=>({...n,eligibleAt:n.eligibleAt>e.available_at?n.eligibleAt:e.available_at})),now)};
}
export function todayV3(db:DB,now:Date):LearningSummaryV3 {
 const day=shDay(now),started=!!db.prepare('SELECT 1 FROM learning_days WHERE day=?').get(day),items=entries(db,day),preview=selection(db,now);
 const touched=items.filter(e=>!!db.prepare('SELECT 1 FROM learning_issues WHERE day=? AND word_id=? LIMIT 1').get(day,e.word_id));
 const active=items.filter(e=>!e.done&&!e.deferred),ready=active.filter(e=>!!needFor(db,e,now).ready).length;
 const stateIndex=evidenceIndex(db,now);
 const total=started?items.length:preview.selected.length,newWords=started?items.filter(e=>e.is_new).length:preview.selected.filter(w=>(stateIndex.get(w.id)??untouchedEvidence()).stage==='new').length;
 const tally=db.prepare('SELECT COUNT(*) answers,COALESCE(SUM(json_extract(result_json,\'$.correct\')),0) correct FROM learning_issues WHERE day=? AND answer_id IS NOT NULL').get(day) as {answers:number;correct:number};
 const attempts=(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE source='live' AND eligible=1 AND substr(datetime(occurred_at,'+8 hours'),1,10)=?").get(day) as any).n;
 const deferred=items.filter(e=>e.deferred).length,resolved=items.filter(e=>e.done||e.deferred).length;
 const index=stateIndex,books={new:0,unfamiliar:0,familiar:0,mastered:0};for(const w of learningWords(db,now)){const s=index.get(w.id)??untouchedEvidence();books[s.stage==='new'?'new':s.stable?'mastered':s.priority||s.stage==='consolidating'?'unfamiliar':'familiar']++;}
 return {policyVersion:3,day,started,total,touched:touched.length,resolved,completed:resolved,deferred,newWords,reviewWords:total-newWords,remaining:total-resolved,backlog:preview.backlog,...tally,attempts,ready,pendingLater:active.length-ready,needsConsolidation:touched.filter(e=>readWordEvidence(db,e.word_id,now).priority||!hasSuccess(db,e.word_id,day)).length,books};
}
export function startV3(db:DB,now:Date){db.transaction(()=>{const day=shDay(now);if(db.prepare('SELECT 1 FROM learning_days WHERE day=?').get(day))return;
 const plan=selection(db,now);db.prepare('INSERT INTO learning_days(day,created_at,policy_version) VALUES (?,?,3)').run(day,now.toISOString());
 const index=evidenceIndex(db,now);
 plan.selected.forEach((w,i)=>{const isNew=(index.get(w.id)??untouchedEvidence()).stage==='new';ensureEvidenceWord(db,w.id,now);db.prepare("INSERT INTO learning_day_words(day,word_id,position,initial_book,is_new,targets,available_at) VALUES (?,?,?,?,?,'[0,0,0]',?)").run(day,w.id,i,w.book,Number(isNew),now.toISOString());});
})();return todayV3(db,now);}
function render(db:DB,i:Issue):LearningCard {
 const w=db.prepare('SELECT headword,meaning_zh,meaning_source FROM words WHERE id=?').get(i.word_id) as LearningWord;
 const shown=legacyIssueHeadword(i,w.headword)??w.headword;
 return {issueId:i.id,wordId:i.word_id,mode:i.mode,patterns:[...new Set(acceptedSpellings(shown).map(h=>h.replace(/[a-z]/gi,'_')))],assisted:!!i.assisted,options:i.mode==='recognize'?JSON.parse(i.options_json):[],...(i.mode==='spell'?{meaning:maskAnswer(w.meaning_zh,shown),meaning_source:w.meaning_source}:i.mode==='dictation'?{audioWord:acceptedSpellings(shown)[0]}:{headword:w.headword})};
}
export function nextV3(db:DB,now:Date):LearningTurnV3{return db.transaction(():LearningTurnV3=>{
 const day=shDay(now);let summary=todayV3(db,now);if(!summary.started)return {policyVersion:3,kind:'idle',summary};
 let active=entries(db,day).filter(e=>!e.done&&!e.deferred);
 for(const e of active){const w=db.prepare('SELECT headword FROM words WHERE id=?').get(e.word_id) as {headword:string};if(!hasDictionaryPlaceholder(w.headword))continue;
  const cancelled=db.prepare("UPDATE learning_issues SET answered_at=? WHERE day=? AND word_id=? AND answered_at IS NULL AND mode<>'recognize'").run(now.toISOString(),day,e.word_id);
  if(cancelled.changes||e.last_mode>0){db.prepare('UPDATE learning_day_words SET last_mode=0 WHERE day=? AND word_id=?').run(day,e.word_id);e.last_mode=0;}
 }
 const open=db.prepare('SELECT * FROM learning_issues WHERE day=? AND answered_at IS NULL ORDER BY issued_at DESC,rowid DESC LIMIT 1').get(day) as Issue|undefined;
 if(open&&active.some(e=>e.word_id===open.word_id))return {policyVersion:3,kind:'card',summary,card:render(db,open)};
 for(const e of active)if(probeCount(db,e.word_id,day)>=1+REVIEW_POLICY.additionalProbesPerDay){
  db.prepare('UPDATE learning_day_words SET done=1 WHERE day=? AND word_id=?').run(day,e.word_id);
  db.prepare('UPDATE learning_card_state SET verification_due=? WHERE card_id IN (SELECT id FROM cards WHERE word_id=?) AND last_failure_at IS NOT NULL AND (verification_due IS NULL OR verification_due<?)').run(nextDay(now),e.word_id,nextDay(now));
 }
 active=entries(db,day).filter(e=>!e.done&&!e.deferred);summary=todayV3(db,now);
 if(!active.length)return {policyVersion:3,kind:'done',reason:summary.deferred?'technical_defer':summary.needsConsolidation?'retry_budget':'resolved',summary};
 const candidates=active.map(e=>({e,...needFor(db,e,now)})),candidate=candidates.find(c=>c.ready);
 if(!candidate){const times=candidates.flatMap(c=>c.needs.map(n=>[n.dueAt,n.eligibleAt,c.e.available_at].sort().at(-1)!)).sort();return {policyVersion:3,kind:'waiting',summary,nextAt:times[0]??nextDay(now)};}
 const {e,ready:need}=candidate,mode=need!.mode,id=randomUUID(),options:{id:number;text:string}[]=[];
 if(mode==='recognize'){
  const w=db.prepare('SELECT meaning_zh FROM words WHERE id=?').get(e.word_id) as any;options.push({id:e.word_id,text:(w.meaning_zh??'').split('\n')[0]});
  for(const other of learningWords(db,now)){if(options.length>=4)break;const text=(other.meaning_zh??'').split('\n')[0];if(other.id!==e.word_id&&text&&!options.some(o=>meaningsOverlap(text,o.text)))options.push({id:other.id,text});}
  options.sort(()=>Math.random()-.5);options.push({id:0,text:'不记得'});
 }
 db.prepare('INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES (?,?,?,?,?,?)').run(id,day,e.word_id,mode,JSON.stringify(options),now.toISOString());
 db.prepare('UPDATE learning_day_words SET last_mode=? WHERE day=? AND word_id=?').run(MODES.indexOf(mode),day,e.word_id);
 const issue=db.prepare('SELECT * FROM learning_issues WHERE id=?').get(id) as Issue;
 return {policyVersion:3,kind:'card',reason:need!.group,summary:todayV3(db,now),card:render(db,issue)};
})();}
function active(db:DB,id:unknown,now:Date){
 if(typeof id!=='string'||!id||id.length>80)throw new HttpError(400,'题目编号无效。');
 const issue=db.prepare('SELECT * FROM learning_issues WHERE id=?').get(id) as Issue|undefined;
 if(!issue)throw new HttpError(404,'题目不存在。');
 if(issue.answered_at||issue.day!==shDay(now))throw new HttpError(409,'题目已更新，请返回今日任务继续。');
 if(issue.mode!=='recognize'&&hasDictionaryPlaceholder((db.prepare('SELECT headword FROM words WHERE id=?').get(issue.word_id) as {headword:string}).headword))throw new HttpError(409,'题目已更新，请返回今日任务继续。');
 const entry=db.prepare('SELECT * FROM learning_day_words WHERE day=? AND word_id=?').get(issue.day,issue.word_id) as Entry;
 if(!entry||entry.done||entry.deferred)throw new HttpError(409,'本轮已结束。');return {issue,entry};
}
export function consultV3(db:DB,input:unknown,now:Date){return db.transaction(()=>{
 const v=input as ConsultInput;if(!v||v.policyVersion!==3||typeof v.eventId!=='string'||!v.eventId.trim()||v.eventId.length>100)throw new HttpError(400,'请使用新版学习入口。');
 const existing=db.prepare('SELECT word_id,issue_id FROM learning_events WHERE event_key=?').get('exposure:'+v.eventId) as any;
 if(existing){if(existing.issue_id!==v.issueId)throw new HttpError(409,'阅读编号已经使用。');return {ok:true};}
 const {issue}=active(db,v.issueId,now);
 saveProbe(db,issue.id,classifyEvidence({correct:false,assisted:true,nowMs:+now,latestExposureMs:null,probeAlreadySaved:!!db.prepare("SELECT 1 FROM learning_events WHERE issue_id=? AND kind IN ('probe_success','probe_failure')").get(issue.id)},REVIEW_POLICY),now);
 saveExposure(db,{wordId:issue.word_id,issueId:issue.id,eventId:v.eventId,reason:'help'},now);
 db.prepare('UPDATE learning_issues SET assisted=1 WHERE id=?').run(issue.id);return {ok:true};
})();}
export function answerV3(db:DB,input:LearningAnswer,now:Date):LearningResultV3{return db.transaction(()=>{
 if(!input||typeof input.answerId!=='string'||!input.answerId.trim()||input.answerId.length>100)throw new HttpError(400,'提交编号无效。');
 const replay=db.prepare('SELECT id,result_json FROM learning_issues WHERE answer_id=?').get(input.answerId) as any;
 if(replay){if(replay.id!==input.issueId)throw new HttpError(409,'提交编号已经使用。');return JSON.parse(replay.result_json);}
 if(db.prepare('SELECT 1 FROM review_logs WHERE answer_id=?').get(input.answerId))throw new HttpError(409,'提交编号已经使用。');
 if(input.policyVersion!==3)throw new HttpError(409,'请刷新后使用新版背词入口。');
 const {issue}=active(db,input.issueId,now),w=db.prepare('SELECT headword,meaning_zh FROM words WHERE id=?').get(issue.word_id) as any;
 if(input.durationMs!==undefined&&(!Number.isFinite(input.durationMs)||input.durationMs<0||input.durationMs>300000))throw new HttpError(400,'答题时长无效。');
 let correct:boolean;if(issue.mode==='recognize'){if(!Number.isSafeInteger(input.choiceId)||!JSON.parse(issue.options_json).some((o:any)=>o.id===input.choiceId))throw new HttpError(400,'请选择题目答案。');correct=input.choiceId===issue.word_id;}
 else {if(typeof input.answer!=='string'||!input.answer.trim()||input.answer.length>256)throw new HttpError(400,'请输入英文单词。');correct=acceptedSpellings(legacyIssueHeadword(issue,w.headword)??w.headword).includes(normalizeAnswer(input.answer));}
 const exposure=latestExposure(db,issue.word_id),already=!!db.prepare("SELECT 1 FROM learning_events WHERE issue_id=? AND kind IN ('probe_success','probe_failure')").get(issue.id);
 const decision=classifyEvidence({correct,assisted:!!issue.assisted,nowMs:+now,latestExposureMs:exposure?Date.parse(exposure):null,probeAlreadySaved:already},REVIEW_POLICY);
 const saved=saveProbe(db,issue.id,decision,now);if(!saved.applied)recordCorrection(db,issue.id,input.answerId,correct,now);
 if(saved.applied&&input.durationMs!==undefined)db.prepare('UPDATE review_logs SET duration_ms=? WHERE answer_id=?').run(input.durationMs,saved.eventId);
 // Every revealed answer (including a copied correction) restarts the word-wide guard.
 saveExposure(db,{wordId:issue.word_id,issueId:issue.id,eventId:input.answerId,reason:'answer'},now);
 const passed=decision.kind==='probe_success',budget=probeCount(db,issue.word_id,issue.day)>=1+REVIEW_POLICY.additionalProbesPerDay;
 const available=new Date(+now+REVIEW_POLICY.exposureGuardMs).toISOString();
 const max=(db.prepare('SELECT MAX(position) p FROM learning_day_words WHERE day=?').get(issue.day) as any).p;
 db.prepare('UPDATE learning_day_words SET done=?,errors=errors+?,assisted=MAX(assisted,?),available_at=?,position=CASE WHEN ? THEN position ELSE ? END WHERE day=? AND word_id=?').run(Number(passed||budget),Number(decision.kind==='probe_failure'),issue.assisted,available,Number(passed),max+1,issue.day,issue.word_id);
 if(budget&&!passed)db.prepare('UPDATE learning_card_state SET verification_due=? WHERE card_id IN (SELECT id FROM cards WHERE word_id=?) AND last_failure_at IS NOT NULL').run(nextDay(now),issue.word_id);
 const book=projectEvidence(db,issue.word_id,now) as WordBook,state=readWordEvidence(db,issue.word_id,now);
 const result:LearningResultV3={policyVersion:3,correct,assisted:!!issue.assisted,evidenceKind:decision.kind,independentlyRecalled:passed,needsConsolidation:state.priority||!passed,expected:w.headword,meaning:w.meaning_zh??'',book,nextDue:state.dueAt??nextDay(now)};
 db.prepare('UPDATE learning_issues SET answered_at=?,answer_id=?,result_json=? WHERE id=?').run(now.toISOString(),input.answerId,JSON.stringify(result),issue.id);
 recomputeDailyStats(db,[issue.day]);return result;
})();}
export function deferV3(db:DB,id:unknown,now:Date){return db.transaction(()=>{
 if(typeof id==='string'&&db.prepare("SELECT 1 FROM learning_events WHERE event_key=? AND kind='technical_defer'").get(id+':technical'))return {ok:true};
 const {issue}=active(db,id,now);if(issue.mode!=='dictation')throw new HttpError(400,'只能暂缓无法播放的听写。');
 db.prepare("INSERT INTO learning_events(event_key,word_id,mode,issue_id,kind,occurred_at,reason,source) VALUES (?,?,?,?,'technical_defer',?,'audio','live')").run(issue.id+':technical',issue.word_id,issue.mode,issue.id,now.toISOString());
 db.prepare('UPDATE learning_day_words SET deferred=1 WHERE day=? AND word_id=?').run(issue.day,issue.word_id);db.prepare('UPDATE learning_issues SET answered_at=? WHERE id=?').run(now.toISOString(),issue.id);
 const card=evidenceCards(db,issue.word_id).find(c=>c.mode===issue.mode)!;db.prepare('UPDATE learning_card_state SET verification_due=? WHERE card_id=?').run(nextDay(now),card.id);return {ok:true};
})();}
