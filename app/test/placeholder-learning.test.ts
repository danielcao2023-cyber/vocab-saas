import {afterEach,describe,expect,it} from 'vitest';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import type {DB} from '../server/src/db';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
const now=new Date('2026-10-21T01:00:00Z');
const dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(db=>db.close()));
for(const v3 of [false,true]) describe(`placeholder phrases policy ${v3?3:2}`,()=>{
 for(const phrase of ['proceed to sth.','owe sth. to sb.',"take sb.'s breath away",'leave ... alone','take for granted','prefer ... to ...']) it(`only issues recognition for ${phrase}`,()=>{
  const db=v3?makeV3Fixture():makeLegacyFixture();dbs.push(db);db.prepare('UPDATE words SET headword=? WHERE id=1').run(phrase);startLearning(db,now);
  expect(nextLearning(db,now).card?.mode).toBe('recognize');
 });
 it('replaces an already open ellipsis spelling question without changing its history',()=>{
  const db=v3?makeV3Fixture():makeLegacyFixture();dbs.push(db);startLearning(db,now);const old=nextLearning(db,now).card!;
  db.prepare("UPDATE words SET headword='leave ... alone' WHERE id=1").run();db.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(old.issueId);
  const fresh=nextLearning(db,now).card!;expect(fresh.mode).toBe('recognize');expect(fresh.issueId).not.toBe(old.issueId);
  expect(()=>answerLearning(db,{policyVersion:3,issueId:old.issueId,answerId:'stale-ellipsis',answer:'leave ... alone'},now)).toThrow();
  expect((db.prepare('SELECT COUNT(*) n FROM learning_issues').get() as any).n).toBe(2);
 });
 it('replaces an open spelling card without losing past review history and rejects stale submissions',()=>{
  const db=v3?makeV3Fixture():makeLegacyFixture();dbs.push(db);startLearning(db,now);const old=nextLearning(db,now).card!;
  db.prepare("UPDATE words SET headword='owe sth. to sb.' WHERE id=1").run();
  db.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(old.issueId);
  expect(()=>answerLearning(db,{policyVersion:3,issueId:old.issueId,answerId:'direct-stale',answer:'owe sth. to sb.'},now)).toThrow();
  const fresh=nextLearning(db,now).card!;expect(fresh.mode).toBe('recognize');expect(fresh.issueId).not.toBe(old.issueId);
  expect(()=>answerLearning(db,{policyVersion:3,issueId:old.issueId,answerId:'stale',answer:'owe sth. to sb.'},now)).toThrow();
  expect((db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n).toBe(0);
 });
 it('retries recognition after a wrong answer and retains the review record',()=>{
  const db=v3?makeV3Fixture():makeLegacyFixture();dbs.push(db);db.prepare("UPDATE words SET headword='proceed to sth.' WHERE id=1").run();startLearning(db,now);
  const first=nextLearning(db,now).card!;answerLearning(db,{policyVersion:3,issueId:first.issueId,answerId:'wrong',choiceId:0},now);
  const later=new Date(+now+6*60_000);expect(nextLearning(db,later).card?.mode).toBe('recognize');
  expect((db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n).toBe(1);
 });
});
it('repairs an existing offline issue and keeps it repaired after database export and reopen',async()=>{
 const source=makeV3Fixture();source.prepare("UPDATE words SET headword='prefer ... to ...' WHERE id=1").run();startLearning(source,now);
 const issue=nextLearning(source,now).card!;source.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(issue.issueId);
 const mobile=await openBrowserDatabase(source.serialize());source.close();
 try{const db=asSharedDb(mobile);const replacement=nextLearning(db,now).card!;expect(replacement.mode).toBe('recognize');expect(replacement.issueId).not.toBe(issue.issueId);
  const reopened=await openBrowserDatabase(mobile.export());try{expect(nextLearning(asSharedDb(reopened),now).card?.issueId).toBe(replacement.issueId);}finally{reopened.close();}
 }finally{mobile.close();}
});
