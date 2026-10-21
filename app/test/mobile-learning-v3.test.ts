import {expect,it,vi} from 'vitest';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {startLearning,nextLearning,consultLearning,answerLearning,learningToday} from '../server/src/learning/engine';
import {createLocalRuntime,prepareEvidenceDatabase} from '../web/src/offline/runtime';
import {learningViews} from '../server/src/learning/evidence-views';
const t=new Date('2026-10-21T01:00:00Z');
const post=(r:ReturnType<typeof createLocalRuntime>,p:string,b:any)=>r.fetch(p,{method:'POST',body:JSON.stringify(b)});
it('runs the same evidence/FSRS sequence in Node and sql.js and after export/reopen',async()=>{
 const node=makeV3Fixture(2,t),mobile=await openBrowserDatabase(node.serialize()),sql=asSharedDb(mobile);
 try{
 for(const db of [node,sql]){startLearning(db,t);let c=nextLearning(db,t).card!;consultLearning(db,{policyVersion:3,issueId:c.issueId,eventId:'help'},t);answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'copy',answer:'experience'},t);c=nextLearning(db,t).card!;answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'clean',answer:(db.prepare('SELECT headword FROM words WHERE id=?').get(c.wordId) as any).headword},t);const later=new Date(+t+300000);c=nextLearning(db,later).card!;answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'probe',answer:'experience'},later);}
 for(const table of ['cards','learning_card_state'])expect(sql.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()).toEqual(node.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
 const events=(db:any)=>db.prepare('SELECT word_id,mode,kind,occurred_at,rating,eligible,delayed FROM learning_events ORDER BY id').all();expect(events(sql)).toEqual(events(node));expect(learningToday(sql,t)).toEqual(learningToday(node,t));
 const restored=await openBrowserDatabase(mobile.export());try{expect(events(asSharedDb(restored))).toEqual(events(node));expect(learningViews(asSharedDb(restored),'priority',1,t)).toEqual(learningViews(node,'priority',1,t));}finally{restored.close();}
 }finally{mobile.close();node.close();}
});
it('backs up before activation and never publishes a runtime until migrated bytes are durable',async()=>{
 const legacy=makeLegacyFixture(),bytes=legacy.serialize();legacy.close();const db=await openBrowserDatabase(bytes),order:string[]=[];
 try{await prepareEvidenceDatabase(db,bytes,{createMigrationBackup:async b=>{expect(b).toEqual(bytes);order.push('backup');},save:async()=>{expect((db.prepare("SELECT value FROM learning_policy_meta WHERE key='version'").get() as any).value).toBe('3');order.push('save');}},t);expect(order).toEqual(['backup','save']);}finally{db.close();}
 const another=await openBrowserDatabase(bytes);try{await expect(prepareEvidenceDatabase(another,bytes,{createMigrationBackup:async()=>{throw new Error('backup failed');},save:vi.fn()},t)).rejects.toThrow('backup failed');expect(another.prepare("SELECT value FROM learning_policy_meta WHERE key='version'").get()).toBeUndefined();}finally{another.close();}
});
it('blocks unrelated operations after a failed persist and retries only the original operation',async()=>{
 const source=makeV3Fixture(1,t),db=await openBrowserDatabase(source.serialize());source.close();let fail=false;const r=createLocalRuntime({db,now:()=>t,assetFetch:vi.fn(),recordings:{},save:async()=>{if(fail)throw new Error('disk full');}});
 try{await post(r,'/api/learning/start',{policyVersion:3});const c=await(await r.fetch('/api/learning/next')).json();fail=true;const body={policyVersion:3,issueId:c.card.issueId,answerId:'same',answer:'experience'};
 expect((await post(r,'/api/learning/answer',body)).status).toBe(503);expect((await r.fetch('/api/learning/next')).status).toBe(503);fail=false;expect((await post(r,'/api/learning/answer',body)).status).toBe(200);expect((await(await r.fetch('/api/learning/next')).json()).kind).toBe('done');expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()?.n).toBe(1);
 }finally{db.close();}
});
