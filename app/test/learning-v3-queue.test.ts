import {afterEach,expect,it} from 'vitest';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning,consultLearning,learningToday,deferLearning} from '../server/src/learning/engine';
import {readWordEvidence,saveExposure} from '../server/src/learning/evidence-store';
import type {DB} from '../server/src/db';
const t=new Date('2026-10-21T01:00:00Z'),dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(d=>d.close()));
function fixture(n=1){const db=makeV3Fixture(n,t);dbs.push(db);return db;}
function answer(db:DB,now=t,correct=true,id:string=crypto.randomUUID()){const turn=nextLearning(db,now),c=turn.card!;expect(turn.kind).toBe('card');return answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:id,choiceId:correct?c.wordId:0,answer:correct?(db.prepare('SELECT headword FROM words WHERE id=?').get(c.wordId) as any).headword:'wrong'} as any,now) as any;}
it('keeps helped experience pending, protects five minutes, then ends today without clearing priority',()=>{
 const db=fixture();startLearning(db,t);const first=nextLearning(db,t);expect(first.card?.mode).toBe('spell');
 consultLearning(db,{policyVersion:3,issueId:first.card!.issueId,eventId:'help-1'},t);
 const result=answer(db,t,true,'copy-1');expect(result).toMatchObject({independentlyRecalled:false,needsConsolidation:true});
 expect(nextLearning(db,new Date(+t+60000)).kind).toBe('waiting');
 const later=new Date(+t+300000);expect(answer(db,later)).toMatchObject({independentlyRecalled:true});
 expect(readWordEvidence(db,1,later)).toMatchObject({priority:true,stable:false});expect(nextLearning(db,later).kind).toBe('done');
 expect(db.prepare('SELECT rating FROM review_logs ORDER BY id').all()).toEqual([{rating:1},{rating:3}]);
});
it('keeps forty unique slots and one clean answer per new word without forced nine questions',()=>{
 const db=fixture(60);startLearning(db,t);startLearning(db,t);for(let i=0;i<40;i++)answer(db,t);
 expect(learningToday(db,t)).toMatchObject({total:40,touched:40,resolved:40,attempts:40});expect(nextLearning(db,t).kind).toBe('done');
});
it('serves another ready word before a protected failed word',()=>{
 const db=fixture(2);startLearning(db,t);const id=nextLearning(db,t).card!.wordId;answer(db,t,false);expect(nextLearning(db,t).card!.wordId).not.toBe(id);answer(db,t);expect(nextLearning(db,t).kind).toBe('waiting');
});
it('limits difficult words to two additional probes and keeps next-day obligations',()=>{
 const db=fixture();startLearning(db,t);answer(db,t,false);answer(db,new Date(+t+300000),false);answer(db,new Date(+t+600000),false);
 expect(nextLearning(db,new Date(+t+900000))).toMatchObject({kind:'done',reason:'retry_budget'});expect(learningToday(db,t)).toMatchObject({needsConsolidation:1,attempts:3});
 const tomorrow=new Date(+t+86400000);startLearning(db,tomorrow);expect(nextLearning(db,tomorrow).kind).toBe('card');
});
it('does not confuse a new calendar day with a twenty-four-hour delayed recall',()=>{
 const db=fixture(),night=new Date('2026-10-21T15:59:00Z');startLearning(db,night);answer(db,night,false);
 const next=new Date(+night+300000);startLearning(db,next);answer(db,next);
 expect(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE delayed=1").get()).toEqual({n:0});expect(readWordEvidence(db,1,next).priority).toBe(true);
});
it('keeps answer replay idempotent across midnight and rejects unsaved stale answers',()=>{
 const db=fixture();startLearning(db,t);const c=nextLearning(db,t).card!;const r=answer(db,t,true,'saved');
 expect(answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'saved'} as any,new Date(+t+86400000))).toEqual(r);
 expect(()=>answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'new',answer:'experience'} as any,new Date(+t+86400000))).toThrow();
});
it('late exposure of any mode prevents an open issue from gaining independent credit',()=>{
 const db=fixture();startLearning(db,t);nextLearning(db,t);saveExposure(db,{wordId:1,eventId:'view',reason:'lesson'},new Date(+t+1000));
 expect(answer(db,new Date(+t+2000))).toMatchObject({independentlyRecalled:false,evidenceKind:'correction'});
 expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:0});
});
it('rotates long-missing siblings even after repeated spelling failures',()=>{
 const db=fixture();startLearning(db,t);answer(db,t,false);
 const day3=new Date(+t+3*86400000);startLearning(db,day3);expect(nextLearning(db,day3).card?.mode).toBe('dictation');answer(db,day3);
 const day4=new Date(+t+4*86400000);startLearning(db,day4);expect(nextLearning(db,day4).card?.mode).toBe('recognize');
});
it('keeps unfinished word IDs ahead of fresh fills on the next day',()=>{
 const db=fixture(60);startLearning(db,t);const ids=db.prepare('SELECT word_id FROM learning_day_words ORDER BY position').all();
 const day1=new Date(+t+86400000);startLearning(db,day1);expect(learningToday(db,day1)).toMatchObject({newWords:40,reviewWords:0});expect(db.prepare('SELECT word_id FROM learning_day_words WHERE day=? ORDER BY position').all('2026-10-22').sort((a:any,b:any)=>a.word_id-b.word_id)).toEqual(ids.sort((a:any,b:any)=>a.word_id-b.word_id));
});
it('never lets a success in one capability certify its siblings or create a stable word',()=>{
 const db=fixture();startLearning(db,t);answer(db,t);
 const state=readWordEvidence(db,1,t);expect(state).toMatchObject({stable:false,stage:'consolidating'});expect(state.weakModes).toEqual(expect.arrayContaining(['recognize','dictation']));
});
it('does not pull validated future cards forward merely because three days passed',()=>{
 const db=fixture();startLearning(db,t);answer(db,t);
 db.prepare("UPDATE cards SET reps=5,scheduled_days=30,due='2026-12-01T00:00:00.000Z'").run();db.prepare("UPDATE learning_card_state SET verification_due=NULL,verification_required=0,delayed_successes=2,recovery_days='[\"2026-10-22\",\"2026-10-23\"]'").run();
 const day4=new Date(+t+4*86400000);expect(learningToday(db,day4)).toMatchObject({reviewWords:0,total:0});expect(readWordEvidence(db,1,day4).stable).toBe(true);
});
it('keeps earlier-due listening ahead of spelling within the same due group',()=>{
 const db=fixture();startLearning(db,t);answer(db,t);db.prepare("UPDATE cards SET reps=3,due='2026-10-22T00:00:00.000Z'").run();db.prepare("UPDATE cards SET due='2026-10-21T12:00:00.000Z' WHERE mode='dictation'").run();db.prepare("UPDATE learning_card_state SET delayed_successes=2,verification_required=0,verification_due=NULL,recovery_days='[\"2026-10-19\",\"2026-10-20\"]'").run();
 const next=new Date(+t+86400000);startLearning(db,next);expect(nextLearning(db,next).card?.mode).toBe('dictation');
});
it('keeps technical deferral out of memory ratings and repeats its acknowledgement safely',()=>{
 const db=fixture();startLearning(db,t);const i=nextLearning(db,t).card!;db.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(i.issueId);
 // An audio problem is not evidence of forgetting.
 const before=db.prepare('SELECT * FROM cards').all();expect(deferLearning(db,i.issueId,t)).toEqual({ok:true});expect(deferLearning(db,i.issueId,t)).toEqual({ok:true});expect(db.prepare('SELECT * FROM cards').all()).toEqual(before);expect(learningToday(db,t)).toMatchObject({deferred:1,attempts:0});
});
