import {describe,expect,it} from 'vitest';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {capabilityNeeds,ensureEvidenceWord} from '../server/src/learning/evidence-store';
import {hasDictionaryPlaceholder} from '../server/src/text';
import {queueState,checkSpelling} from '../server/src/study';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import type {DB} from '../server/src/db';

// The 16 textbook skeletons identified by the catalog audit; do not infer arbitrary parentheses.
const skeletons=['cut ... out','compare ... with ...','compare ... to ...','date back to ...','prevent ... from','donate ... to ...','keep ... in mind','join ... to ...','range from ... to ...','to ... extent','in a ... manner','keep in touch with ...','devote ... to','slice ... off','bring ... to life','on a ... basis','from (then) on'];
const now=new Date('2026-10-21T01:00:00Z');
function fixture(v3:boolean){return v3?makeV3Fixture():makeLegacyFixture()}
function rename(db:DB,name:string){db.prepare('UPDATE words SET headword=? WHERE id=1').run(name)}
function status(db:DB){return {logs:db.prepare('SELECT * FROM review_logs ORDER BY id').all(),events:db.prepare('SELECT * FROM learning_events ORDER BY id').all(),cards:db.prepare('SELECT * FROM cards ORDER BY id').all(),word:db.prepare('SELECT * FROM learning_words ORDER BY word_id').all(),evidence:db.prepare('SELECT * FROM learning_card_state ORDER BY card_id').all()}}
function expectConflict(action:()=>unknown){try{action();expect.fail('obsolete issue was accepted')}catch(e){expect(e).toMatchObject({status:409})}}

describe('textbook placeholder classification',()=>{
 it.each(skeletons)('limits %s to recognition',word=>expect(hasDictionaryPlaceholder(word)).toBe(true));
 it.each(['from then on','at last','take notes','look forward to','color (colour)','according (to)'])('keeps ordinary expression %s unrestricted',word=>expect(hasDictionaryPlaceholder(word)).toBe(false));
});
for(const v3 of [false,true]) describe(`policy ${v3?3:2}`,()=>{
 it.each(skeletons)('issues recognition for new %s and retry after an error',word=>{
  const db=fixture(v3);try{rename(db,word);startLearning(db,now);const card=nextLearning(db,now).card!;expect(card.mode).toBe('recognize');
   answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'wrong-'+word,choiceId:0},now);
   expect(nextLearning(db,new Date(+now+6*60_000)).card?.mode).toBe('recognize');
  }finally{db.close()}
 });
 it.each(skeletons)('issues recognition for due, previously studied %s',word=>{
  const db=fixture(v3);try{rename(db,word);ensureEvidenceWord(db,1,now);
   db.prepare("UPDATE cards SET reps=2, state=2, due='2026-10-20T00:00:00Z' WHERE word_id=1").run();
   startLearning(db,now);expect(nextLearning(db,now).card?.mode).toBe('recognize');
  }finally{db.close()}
 });
 it.each(skeletons.flatMap(word=>['spell','dictation'].map(mode=>[word,mode] as const)))('restores obsolete %s %s without recording stale answers', (word,mode)=>{
  const db=fixture(v3);try{
   startLearning(db,now);const old=nextLearning(db,now).card!;rename(db,word);db.prepare('UPDATE learning_issues SET mode=? WHERE id=?').run(mode,old.issueId);
   const before=status(db);expectConflict(()=>answerLearning(db,{policyVersion:3,issueId:old.issueId,answerId:'before',answer:word},now));expect(status(db)).toEqual(before);
   const fresh=nextLearning(db,now).card!;expect(fresh.mode).toBe('recognize');expect(fresh.issueId).not.toBe(old.issueId);
   const after=status(db);expect(after).toEqual(before);expectConflict(()=>answerLearning(db,{policyVersion:3,issueId:old.issueId,answerId:'after',answer:word},now));expect(status(db)).toEqual(after);
  }finally{db.close()}
 });
 it('does not expose bogus spelling patterns for the textbook parenthetical skeleton',()=>{
  const db=fixture(v3);try{rename(db,'from (then) on');startLearning(db,now);const card=nextLearning(db,now).card!;expect(card.mode).toBe('recognize');expect(card.patterns).toEqual([])}finally{db.close()}
 });
 it('preserves already answered history across a new-word repair',()=>{
  const db=fixture(v3);try{startLearning(db,now);const card=nextLearning(db,now).card!;answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'historical',...(card.mode==='recognize'?{choiceId:1}:{answer:'experience'})},now);
   const logs=db.prepare('SELECT * FROM review_logs ORDER BY id').all();const events=db.prepare('SELECT * FROM learning_events ORDER BY id').all();const issue=db.prepare("SELECT * FROM learning_issues WHERE answer_id='historical'").get();
   rename(db,'from (then) on');nextLearning(db,new Date(+now+6*60_000));expect(db.prepare('SELECT * FROM review_logs ORDER BY id').all()).toEqual(logs);expect(db.prepare('SELECT * FROM learning_events ORDER BY id').all()).toEqual(events);expect(db.prepare("SELECT * FROM learning_issues WHERE answer_id='historical'").get()).toEqual(issue);
  }finally{db.close()}
 });
 it('keeps the complete independent phrase eligible for spelling',()=>{
  const db=fixture(v3);try{rename(db,'from then on');startLearning(db,now);const card=nextLearning(db,now).card!;
   if(v3)expect(card.mode).toBe('spell');else{const spell=db.prepare("SELECT id FROM cards WHERE word_id=1 AND mode='spell'").get() as {id:number};expect(()=>checkSpelling(db,spell.id,'from then on',now)).not.toThrow();}
  }finally{db.close()}
 });
});
it.each(skeletons)('excludes prohibited capabilities and old due modes for %s',word=>{
 const db=makeLegacyFixture();try{rename(db,word);startLearning(db,now);db.prepare("UPDATE cards SET due='2026-10-20T00:00:00Z' WHERE mode IN ('spell','dictation')").run();db.prepare("UPDATE cards SET due='2026-10-25T00:00:00Z' WHERE mode='recognize'").run();expect(queueState(db,now).review).toBe(0);
  for(const mode of ['spell','dictation']){const card=db.prepare('SELECT id FROM cards WHERE mode=?').get(mode) as {id:number};expect(()=>checkSpelling(db,card.id,'then',now)).toThrow()}
 }finally{db.close()}
 const v3=makeV3Fixture();try{rename(v3,word);ensureEvidenceWord(v3,1,now);expect(capabilityNeeds(v3,1,now).map(x=>x.mode)).toEqual(['recognize'])}finally{v3.close()}
});
for(const v3 of [false,true])it.each(skeletons)('offline policy '+(v3?3:2)+' restores %s and persists the replacement',async word=>{
 const source=fixture(v3);startLearning(source,now);const old=nextLearning(source,now).card!;rename(source,word);source.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(old.issueId);
 const mobile=await openBrowserDatabase(source.serialize());source.close();try{const db=asSharedDb(mobile),before=status(db);expectConflict(()=>answerLearning(db,{policyVersion:3,issueId:old.issueId,answerId:'offline-stale',answer:'then'},now));expect(status(db)).toEqual(before);
 const fresh=nextLearning(db,now).card!;expect(fresh.mode).toBe('recognize');expect(fresh.issueId).not.toBe(old.issueId);expect(status(db)).toEqual(before);
 const reopened=await openBrowserDatabase(mobile.export());try{expect(nextLearning(asSharedDb(reopened),now).card?.issueId).toBe(fresh.issueId);expect(status(asSharedDb(reopened))).toEqual(before)}finally{reopened.close()}
 }finally{mobile.close()}
});
