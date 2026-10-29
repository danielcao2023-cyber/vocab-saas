import {it,expect,vi} from 'vitest';
import {database,T} from './v3-helpers';
import {migrateLearning} from '../server/src/learning/schema';
import {nextV3} from '../server/src/learning/evidence-engine';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareEvidenceDatabase} from '../web/src/offline/runtime';

function legacy(){
 const db=database(0);
 db.prepare("INSERT INTO words(id,headword,meaning_zh,source) VALUES (1,'bow','弓','vocabulary'),(2,'contract','合同','vocabulary'),(3,'other','其他','vocabulary')").run();
 activateEvidencePolicy(db,T);
 db.prepare("INSERT INTO learning_days(day,created_at,policy_version) VALUES ('2026-10-17',?,3)").run(T.toISOString());
 for(let id=1;id<=3;id++)db.prepare("INSERT INTO learning_day_words(day,word_id,position,initial_book,is_new,targets,available_at) VALUES ('2026-10-17',?,?,'new',1,'[0,0,0]',?)").run(id,id,T.toISOString());
 for(let id=1;id<=3;id++)db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES (?,'2026-10-17',?,'dictation','[]',?)").run('i'+id,id,T.toISOString());
 // Construct an actual old schema independently of whichever schema openDb creates.
 if((db.prepare('PRAGMA table_info(learning_issues)').all() as any[]).some(x=>x.name==='audio_variant')) db.exec('ALTER TABLE learning_issues DROP COLUMN audio_variant');
 return db;
}
it('migrates only open bow/contract dictations and preserves answered history',()=>{
 const db=legacy();try{
  db.prepare("UPDATE learning_issues SET answered_at=?,answer_id='old-answer',result_json='{\"correct\":true}' WHERE id='i2'").run(T.toISOString());
  migrateLearning(db);
  expect(db.prepare('SELECT id,audio_variant,answer_id,result_json FROM learning_issues ORDER BY id').all()).toEqual([
   {id:'i1',audio_variant:'noun',answer_id:null,result_json:null}, {id:'i2',audio_variant:null,answer_id:'old-answer',result_json:'{"correct":true}'}, {id:'i3',audio_variant:null,answer_id:null,result_json:null}]);
  db.prepare("UPDATE learning_issues SET audio_variant='verb' WHERE id='i1'").run();migrateLearning(db);
  expect((db.prepare("SELECT audio_variant FROM learning_issues WHERE id='i1'").get() as any).audio_variant).toBe('verb');
  const card=nextV3(db,T).card;expect(card?.issueId).toBe('i3');expect(card?.audioVariant).toBeUndefined();
 }finally{db.close();}
});
it('backs up an existing v3 database before upgrading and saves bound open issues',async()=>{
 const src=legacy(), bytes=new Uint8Array(src.serialize());src.close();const db=await openBrowserDatabase(bytes);const order:string[]=[];
 try{
  await prepareEvidenceDatabase(db,bytes,{createMigrationBackup:vi.fn(),createDictationVariantBackup:async b=>{expect(b).toEqual(bytes);order.push('backup')},save:async()=>{order.push('save')}},T);
  expect(order).toEqual(['backup','save']);
  expect((asSharedDb(db).prepare("SELECT audio_variant FROM learning_issues WHERE id='i1'").get() as any).audio_variant).toBe('noun');
  const reopened=await openBrowserDatabase(db.export());try{expect((asSharedDb(reopened).prepare("SELECT audio_variant FROM learning_issues WHERE id='i2'").get() as any).audio_variant).toBe('noun')}finally{reopened.close()}
 }finally{db.close()}
});
it('does not alter v3 database when its upgrade backup fails',async()=>{
 const src=legacy(),bytes=new Uint8Array(src.serialize());src.close();const db=await openBrowserDatabase(bytes);
 try{await expect(prepareEvidenceDatabase(db,bytes,{createMigrationBackup:vi.fn(),createDictationVariantBackup:async()=>{throw Error('backup failure')},save:vi.fn()},T)).rejects.toThrow('backup failure');expect(db.prepare('PRAGMA table_info(learning_issues)').all().some((x:any)=>x.name==='audio_variant')).toBe(false)}finally{db.close()}
});
it.each(['bow','contract'])('binds newly issued %s dictation and keeps it on resume and reopen',async word=>{
 const {makeV3Fixture}=await import('./learning-v3-helpers');const {startLearning,nextLearning,answerLearning}=await import('../server/src/learning/engine');const t=new Date('2026-10-21T01:00:00Z');const db=makeV3Fixture(1,t);
 try{db.prepare('UPDATE words SET headword=? WHERE id=1').run(word);startLearning(db,t);const first=nextLearning(db,t).card!;answerLearning(db,{policyVersion:3,issueId:first.issueId,answerId:'first',answer:word},t);
 db.prepare("UPDATE cards SET reps=3,due='2026-10-22T00:00:00.000Z'").run();db.prepare("UPDATE cards SET due='2026-10-21T12:00:00.000Z' WHERE mode='dictation'").run();db.prepare("UPDATE learning_card_state SET delayed_successes=2,verification_required=0,verification_due=NULL,recovery_days='[\"2026-10-19\",\"2026-10-20\"]'").run();
 const later=new Date(+t+86400000);startLearning(db,later);const card=nextLearning(db,later).card!;expect(card).toMatchObject({mode:'dictation',audioWord:word,audioVariant:'verb'});expect(nextLearning(db,later).card).toEqual(card);
 const mobile=await openBrowserDatabase(db.serialize());try{expect(nextLearning(asSharedDb(mobile),later).card).toEqual(card)}finally{mobile.close()}
 }finally{db.close()}
});
it('preserves a bound V2 dictation across issue resume and new issue generation',async()=>{
 const {makeLegacyFixture}=await import('./learning-v3-helpers');const {startLearning,nextLearning}=await import('../server/src/learning/engine');const t=new Date('2026-10-21T01:00:00Z');const db=makeLegacyFixture(1);
 try{db.prepare("UPDATE words SET headword='bow' WHERE id=1").run();startLearning(db,t);db.prepare("UPDATE learning_day_words SET targets='[0,0,1]',streaks='[0,0,0]' WHERE word_id=1").run();const card=nextLearning(db,t).card!;expect(card).toMatchObject({mode:'dictation',audioWord:'bow',audioVariant:'verb'});expect(nextLearning(db,t).card).toEqual(card)}finally{db.close()}
});
it('binds to the verified current default recording for both heteronyms',async()=>{
 const {readFileSync}=await import('node:fs');const manifest=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries;
 for(const word of ['bow','contract'])expect(manifest[word].sha256).toBe(manifest[word].variants.verb.sha256);
});
it.each(['online','offline'])('%s upgrades a real old V2 open dictation only after backup, closes it and retains answered history',async kind=>{
 const {makeLegacyFixture}=await import('./learning-v3-helpers');const {startLearning,nextLearning,answerLearning}=await import('../server/src/learning/engine');const {evidenceVersion,activateEvidencePolicy}=await import('../server/src/learning/evidence-migration');const t=new Date('2026-10-21T01:00:00Z');const old=makeLegacyFixture(2);
 old.prepare("UPDATE words SET headword='bow' WHERE id=1").run();startLearning(old,t);const initial=nextLearning(old,t).card!;answerLearning(old,{issueId:initial.issueId,answerId:'old-answer',answer:'bow',choiceId:1},t);
 const issue=nextLearning(old,t).card!;old.prepare("UPDATE words SET headword='contract' WHERE id=?").run(issue.wordId);old.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(issue.issueId);
 const historical=old.prepare("SELECT id,answer_id,result_json FROM learning_issues WHERE answer_id='old-answer'").get();old.exec('ALTER TABLE learning_issues DROP COLUMN audio_variant');const bytes=new Uint8Array(old.serialize());old.close();
 let db:any,mobile:any,tmp='';try{
  if(kind==='offline'){mobile=await openBrowserDatabase(bytes);let backup:Uint8Array|undefined,saved:Uint8Array|undefined;await prepareEvidenceDatabase(mobile,bytes,{createMigrationBackup:async b=>{backup=new Uint8Array(b)},save:async b=>{expect(backup).toEqual(bytes);saved=new Uint8Array(b)}},t);mobile.close();mobile=await openBrowserDatabase(saved!);db=asSharedDb(mobile)}
  else{const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path'),{openDb}=await import('../server/src/db'),{verifiedBackup}=await import('../server/src/guard');tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dictation-v2-test-'));const file=path.join(tmp,'user.db'),backup=path.join(tmp,'backup.db');fs.writeFileSync(file,bytes);await verifiedBackup(file,backup);const Database=(await import('better-sqlite3')).default;const copy=new Database(backup,{readonly:true});try{expect(copy.prepare("SELECT id,answer_id,result_json FROM learning_issues WHERE answer_id='old-answer'").get()).toEqual(historical);expect(copy.prepare('PRAGMA table_info(learning_issues)').all().some((x:any)=>x.name==='audio_variant')).toBe(false)}finally{copy.close()}db=openDb(file);activateEvidencePolicy(db,t);db.close();db=openDb(file)}
  expect(evidenceVersion(db)).toBe(3);expect(db.prepare("SELECT id,answer_id,result_json FROM learning_issues WHERE answer_id='old-answer'").get()).toEqual(historical);
  expect(db.prepare('SELECT answered_at,audio_variant FROM learning_issues WHERE id=?').get(issue.issueId)).toEqual({answered_at:t.toISOString(),audio_variant:'noun'});
  db.prepare("UPDATE cards SET reps=3,due='2026-10-22T00:00:00.000Z' WHERE word_id=?").run(issue.wordId);db.prepare("UPDATE cards SET due='2026-10-20T00:00:00.000Z' WHERE word_id=? AND mode='dictation'").run(issue.wordId);db.prepare("UPDATE learning_card_state SET delayed_successes=2,verification_required=0,verification_due=NULL,recovery_days='[\"2026-10-19\",\"2026-10-20\"]' WHERE card_id IN (SELECT id FROM cards WHERE word_id=?)").run(issue.wordId);const resumed=nextLearning(db,t);expect(resumed.card).toMatchObject({mode:'dictation',audioWord:'contract',audioVariant:'verb'});expect(resumed.card?.issueId).not.toBe(issue.issueId);expect(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE issue_id=? AND kind='probe_success'").get(issue.issueId)).toEqual({n:0});
 }finally{if(mobile)mobile.close();else db?.close();if(tmp){const fs=await import('node:fs');fs.rmSync(tmp,{recursive:true,force:true})}}
});
