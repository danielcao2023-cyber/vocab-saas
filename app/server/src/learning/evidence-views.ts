import type {DB} from '../db.ts';
import {HttpError} from '../http-error.ts';
import {shDay} from '../time.ts';
import type {LearningView,LearningViews,LearningMode,WordEvidenceState,WordBook} from '../../../shared/learning.ts';
import {learningWords} from './selection.ts';
import {evidenceIndex,untouchedEvidence} from './evidence-store.ts';
import {MODES} from './policy.ts';
export const LEARNING_VIEWS:LearningView[]=['all','new','due','priority','stable','weak_spell','weak_dictation'];
export const evidenceBook=(s:WordEvidenceState):WordBook=>s.stage==='new'?'new':s.stable?'mastered':s.priority||s.stage==='consolidating'?'unfamiliar':'familiar';
export function learningViews(db:DB,view:LearningView='all',page=1,now=new Date()):LearningViews {
 if(!LEARNING_VIEWS.includes(view)||!Number.isSafeInteger(page)||page<1)throw new HttpError(400,'筛选或页码无效。');
 const index=evidenceIndex(db,now);
 const rows=learningWords(db).map(w=>({id:w.id,headword:w.headword,meaning:w.meaning_zh??'',phonetic:w.phonetic,level:w.level,evidenceState:index.get(w.id)??untouchedEvidence()}));
 const match=(s:WordEvidenceState,v:LearningView)=>v==='all'||v==='new'&&s.stage==='new'||v==='due'&&s.dueAt!==null&&s.dueAt<=now.toISOString()||v==='priority'&&s.priority||v==='stable'&&s.stable||v==='weak_spell'&&s.stage!=='new'&&s.weakModes.includes('spell')||v==='weak_dictation'&&s.stage!=='new'&&s.weakModes.includes('dictation');
 const counts=Object.fromEntries(LEARNING_VIEWS.map(v=>[v,rows.filter(r=>match(r.evidenceState,v)).length])) as Record<LearningView,number>;
 const filtered=rows.filter(r=>match(r.evidenceState,view)).sort((a,b)=>Number(b.evidenceState.priority)-Number(a.evidenceState.priority)||(a.evidenceState.dueAt??'').localeCompare(b.evidenceState.dueAt??'')||a.id-b.id),size=40;
 return {policyVersion:3,view,counts,items:filtered.slice((page-1)*size,page*size),total:filtered.length,page,size};
}
export interface ModeMetrics {samples:number;successes:number;accuracy:number|null;helpRate:number|null;delayedSamples:number;delayedSuccesses:number;delayedAccuracy:number|null;durationMs:number}
export interface EvidenceMetrics {policyVersion:3;since:string|null;through:string;modes:Record<LearningMode,ModeMetrics>;technicalDefers:number}
/** First eligible probe per card/day; raw later probes still update scheduling. */
export function evidenceMetrics(db:DB,now=new Date(),days=30):EvidenceMetrics {
 const end=shDay(now),start=shDay(new Date(+now-(days-1)*86400000));
 const events=db.prepare("SELECT e.*,l.duration_ms FROM learning_events e LEFT JOIN review_logs l ON l.id=e.review_log_id WHERE e.source='live' AND e.eligible=1 AND e.occurred_at<=? AND substr(datetime(e.occurred_at,'+8 hours'),1,10)>=? ORDER BY e.occurred_at,e.id").all(now.toISOString(),start) as any[];
 const seen=new Set<string>(),first=events.filter(e=>{const k=e.word_id+':'+e.mode+':'+shDay(new Date(e.occurred_at));if(seen.has(k))return false;seen.add(k);return true;});
 const modes=Object.fromEntries(MODES.map(mode=>{const rows=first.filter(e=>e.mode===mode),samples=rows.length,successes=rows.filter(e=>e.kind==='probe_success').length,delayed=rows.filter(e=>e.delayed),delayedSuccesses=delayed.filter(e=>e.kind==='probe_success').length;return [mode,{samples,successes,accuracy:samples?successes/samples:null,helpRate:samples?rows.filter(e=>e.reason==='help').length/samples:null,delayedSamples:delayed.length,delayedSuccesses,delayedAccuracy:delayed.length?delayedSuccesses/delayed.length:null,durationMs:rows.reduce((s,e)=>s+(e.duration_ms??0),0)}];})) as Record<LearningMode,ModeMetrics>;
 return {policyVersion:3,since:(db.prepare("SELECT value FROM learning_policy_meta WHERE key='activated_at'").get() as any)?.value??null,through:end,modes,technicalDefers:(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE kind='technical_defer' AND source='live' AND occurred_at<=? AND substr(datetime(occurred_at,'+8 hours'),1,10)>=?").get(now.toISOString(),start) as any).n};
}
