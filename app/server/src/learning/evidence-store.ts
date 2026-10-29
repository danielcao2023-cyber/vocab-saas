import {createEmptyCard} from 'ts-fsrs';
import type {DB} from '../db.ts';
import {review,type CardRow} from '../study.ts';
import {shDay} from '../time.ts';
import {HttpError} from '../http-error.ts';
import type {EvidenceDecision,WordEvidenceState,CapabilityEvidence,CapabilityNeed,LearningMode} from '../../../shared/learning.ts';
import {MODES,nextDay} from './policy.ts';
import {REVIEW_POLICY} from './evidence-policy.ts';
import {hasDictionaryPlaceholder} from '../text.ts';
export interface EvidenceCard extends CardRow {verification_due:string|null;verification_required:number;last_attempt_at:string|null;last_failure_at:string|null;delayed_successes:number;recovery_days:string}
export function evidenceCards(db:DB,wordId:number):EvidenceCard[]{return db.prepare('SELECT c.*,s.verification_due,s.verification_required,s.last_attempt_at,s.last_failure_at,COALESCE(s.delayed_successes,0) delayed_successes,COALESCE(s.recovery_days,\'[]\') recovery_days FROM cards c LEFT JOIN learning_card_state s ON s.card_id=c.id WHERE c.word_id=?').all(wordId) as EvidenceCard[];}
export function latestExposure(db:DB,wordId:number):string|null{return (db.prepare("SELECT MAX(occurred_at) at FROM learning_events WHERE word_id=? AND kind IN ('exposure','probe_success','probe_failure','correction')").get(wordId) as {at:string|null}).at;}
export function ensureEvidenceWord(db:DB,wordId:number,now:Date){
 if(!db.prepare('SELECT 1 FROM words WHERE id=?').get(wordId))throw new HttpError(404,'单词不存在。');
 db.prepare("INSERT OR IGNORE INTO learning_words(word_id,book,introduced_at,due) VALUES (?,'unfamiliar',?,?)").run(wordId,now.toISOString(),now.toISOString());
 for(const mode of MODES){const c=createEmptyCard(now);db.prepare('INSERT OR IGNORE INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,learning_steps,reps,lapses,state) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(wordId,mode,c.due.toISOString(),c.stability,c.difficulty,c.elapsed_days,c.scheduled_days,c.learning_steps,c.reps,c.lapses,c.state);}
 db.prepare('INSERT OR IGNORE INTO learning_card_state(card_id) SELECT id FROM cards WHERE word_id=?').run(wordId);
}
export function saveExposure(db:DB,input:{wordId:number;issueId?:string;eventId:string;reason:string},now:Date){return db.transaction(()=>{
 if(!Number.isSafeInteger(input.wordId)||input.wordId<1||typeof input.eventId!=='string'||!input.eventId.trim()||input.eventId.length>100||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>80)throw new HttpError(400,'阅读记录无效。');
 const key='exposure:'+input.eventId,previous=db.prepare('SELECT word_id,issue_id,reason FROM learning_events WHERE event_key=?').get(key) as any;
 if(previous){if(previous.word_id!==input.wordId||previous.issue_id!==(input.issueId??null)||previous.reason!==input.reason)throw new HttpError(409,'阅读编号已经使用。');return;}
 let mode:LearningMode='spell';
 if(input.issueId){const issue=db.prepare('SELECT word_id,mode FROM learning_issues WHERE id=?').get(input.issueId) as any;if(!issue||issue.word_id!==input.wordId)throw new HttpError(400,'题目与单词不匹配。');mode=issue.mode;}
 ensureEvidenceWord(db,input.wordId,now);
 db.prepare("INSERT INTO learning_events(event_key,word_id,mode,issue_id,kind,occurred_at,reason,source) VALUES (?,?,?,?,'exposure',?,?,'live')").run(key,input.wordId,mode,input.issueId??null,now.toISOString(),input.reason);
 projectEvidence(db,input.wordId,now);
})();}
export function saveProbe(db:DB,issueId:string,decision:EvidenceDecision,now:Date):{eventId:string;applied:boolean}{return db.transaction(()=>{
 const issue=db.prepare('SELECT word_id,mode FROM learning_issues WHERE id=?').get(issueId) as {word_id:number;mode:LearningMode}|undefined;if(!issue)throw new HttpError(404,'题目不存在。');
 const key=issueId+':probe';if(decision.rating===null)return {eventId:key,applied:false};
 if(db.prepare('SELECT 1 FROM learning_events WHERE event_key=? OR (issue_id=? AND kind IN (\'probe_success\',\'probe_failure\'))').get(key,issueId))return {eventId:key,applied:false};
 ensureEvidenceWord(db,issue.word_id,now);const card=evidenceCards(db,issue.word_id).find(c=>c.mode===issue.mode)!;
 const exposure=latestExposure(db,issue.word_id),delayed=!!card.last_attempt_at&&+now-Date.parse(card.last_attempt_at)>=REVIEW_POLICY.delayedEvidenceMs&&(!exposure||+now-Date.parse(exposure)>=REVIEW_POLICY.delayedEvidenceMs);
 review(db,card.id,decision.rating,now,{evidence:true,answerId:key,correct:decision.rating===3,qtype:issue.mode==='recognize'?'flip':issue.mode});
 const log=(db.prepare('SELECT id FROM review_logs WHERE answer_id=?').get(key) as {id:number}).id;
 db.prepare("INSERT INTO learning_events(event_key,word_id,mode,issue_id,kind,occurred_at,text_correct,eligible,rating,reason,source,review_log_id,delayed) VALUES (?,?,?,?,?,?,?,?,?,?,'live',?,?)").run(key,issue.word_id,issue.mode,issueId,decision.kind,now.toISOString(),decision.reason==='help'?null:Number(decision.rating===3),1,decision.rating,decision.reason,log,Number(delayed));
 let days:string[]=JSON.parse(card.recovery_days),count=card.delayed_successes,lastFail=card.last_failure_at;
 if(decision.rating===1){days=[];count=0;lastFail=now.toISOString();}else if(delayed){count++;days=[...new Set([...days,shDay(now)])];}
 const verification=decision.rating===1?new Date(+now+REVIEW_POLICY.exposureGuardMs).toISOString():delayed?null:nextDay(now);
 db.prepare('UPDATE learning_card_state SET verification_due=?,verification_required=?,last_attempt_at=?,last_failure_at=?,delayed_successes=?,recovery_days=? WHERE card_id=?').run(verification,Number(count===0),now.toISOString(),lastFail,count,JSON.stringify(days),card.id);
 projectEvidence(db,issue.word_id,now);return {eventId:key,applied:true};
})();}
export function recordCorrection(db:DB,issueId:string,answerId:string,correct:boolean,now:Date){const issue=db.prepare('SELECT word_id,mode FROM learning_issues WHERE id=?').get(issueId) as any;db.prepare("INSERT OR IGNORE INTO learning_events(event_key,word_id,mode,issue_id,kind,occurred_at,text_correct,reason,source) VALUES (?,?,?,?,'correction',?,?,'answer_after_exposure','live')").run('correction:'+answerId,issue.word_id,issue.mode,issueId,now.toISOString(),Number(correct));}
export function capabilityEvidence(db:DB,wordId:number):CapabilityEvidence[]{return evidenceCards(db,wordId).map(c=>({mode:c.mode,lastAttemptAt:c.last_attempt_at,lastFailureAt:c.last_failure_at,delayedSuccesses:c.delayed_successes,verificationDue:c.verification_due,dueAt:c.due,scheduledDays:c.scheduled_days}));}
/** Siblings without attempts are evidence debt, not three overdue FSRS cards. */
export function capabilityNeeds(db:DB,wordId:number,now:Date):CapabilityNeed[]{
 const headword=(db.prepare('SELECT headword FROM words WHERE id=?').get(wordId) as {headword:string}).headword;
 const limited=hasDictionaryPlaceholder(headword),cards=evidenceCards(db,wordId).filter(c=>!limited||c.mode==='recognize'),word=db.prepare('SELECT introduced_at FROM learning_words WHERE word_id=?').get(wordId) as {introduced_at:string}|undefined;
 const exposure=latestExposure(db,wordId),eligibleAt=new Date(exposure?Date.parse(exposure)+REVIEW_POLICY.exposureGuardMs:0).toISOString();
 if(!cards.some(c=>c.reps>0||c.last_attempt_at)){const mode=limited?'recognize':REVIEW_POLICY.initialMode;return [{cardId:cards.find(c=>c.mode===mode)?.id??-wordId,mode,group:'initial',dueAt:word?.introduced_at??now.toISOString(),eligibleAt,lastAttemptAt:null}];}
 return cards.flatMap(c=>{
  const unresolved=!!c.last_failure_at&&JSON.parse(c.recovery_days).length<2;
  const origin=unresolved?c.last_failure_at:word?.introduced_at??c.last_review??now.toISOString();
  const missingDate=new Date(Date.parse(shDay(new Date(origin!))+'T00:00:00+08:00')+REVIEW_POLICY.missingEvidenceDays*86400000).toISOString();
  const missing=(c.delayed_successes===0||unresolved)&&missingDate<=now.toISOString();
  const due=[c.reps>0?c.due:null,c.verification_due].filter((s):s is string=>!!s).sort()[0];
  if(!missing&&!due)return [{cardId:c.id,mode:c.mode,group:'missing',dueAt:missingDate,eligibleAt,lastAttemptAt:c.last_attempt_at} as CapabilityNeed];
  return [{cardId:c.id,mode:c.mode,group:missing?'missing':unresolved?'relearn':'due',dueAt:missing?missingDate:due!,eligibleAt,lastAttemptAt:c.last_attempt_at} as CapabilityNeed];
 });
}
export function readWordEvidence(db:DB,wordId:number,now:Date):WordEvidenceState {
 const headword=(db.prepare('SELECT headword FROM words WHERE id=?').get(wordId) as {headword:string}).headword,limited=hasDictionaryPlaceholder(headword);
 const all=evidenceCards(db,wordId),cards=all.filter(c=>!limited||c.mode==='recognize'),contact=!!db.prepare("SELECT 1 FROM learning_events WHERE word_id=? AND kind<>'technical_defer' LIMIT 1").get(wordId)||all.some(c=>c.reps>0);
 const priority=cards.some(c=>!!c.last_failure_at&&JSON.parse(c.recovery_days).length<2);
 const stable=!limited&&cards.length===3&&!priority&&cards.every(c=>c.delayed_successes>0&&JSON.parse(c.recovery_days).length>=2&&(c.mode==='recognize'||c.scheduled_days>=7));
 const due=contact?capabilityNeeds(db,wordId,now).map(n=>n.dueAt).sort()[0]??null:null;
 void now;return {stage:!contact?'new':cards.some(c=>c.delayed_successes>0)?'review':'consolidating',priority,stable,dueAt:due,weakModes:MODES.filter(mode=>(!limited||mode==='recognize')&&(()=>{const c=cards.find(c=>c.mode===mode);return !c||c.delayed_successes===0||!!c.last_failure_at&&JSON.parse(c.recovery_days).length<2;})())};
}
/** Compatibility book is a projection, never a scheduling input in policy 3. */
export function projectEvidence(db:DB,wordId:number,now:Date){const e=readWordEvidence(db,wordId,now);const book=e.stage==='new'?'new':e.stable?'mastered':e.priority||e.stage==='consolidating'?'unfamiliar':'familiar';db.prepare('UPDATE learning_words SET book=?,due=?,last_at=? WHERE word_id=?').run(book,e.dueAt??nextDay(now),now.toISOString(),wordId);return book;}

export const untouchedEvidence=():WordEvidenceState=>({stage:'new',priority:false,stable:false,dueAt:null,weakModes:[...MODES]});
/** One contact scan avoids thousands of empty per-word reads on the offline corpus. */
export function evidenceIndex(db:DB,now:Date){const ids=db.prepare("SELECT DISTINCT word_id FROM learning_events WHERE kind<>'technical_defer' UNION SELECT DISTINCT word_id FROM cards WHERE reps>0").all() as {word_id:number}[];return new Map(ids.map(r=>[r.word_id,readWordEvidence(db,r.word_id,now)]));}
