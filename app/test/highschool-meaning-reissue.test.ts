import {expect,it} from 'vitest';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {meaningsOverlap} from '../server/src/quiz';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
const all=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8')),entry=all.entries.find((e:any)=>e.key==='face down');
const book='pep2019-optional-2',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
function catalog(old:boolean){return {...all,version:old?138:140,books:all.books.filter((b:any)=>b.id===book),units:all.units.filter((u:any)=>u.bookId===book),entries:[{...entry,meaning:old?entry.meaningCorrection.expected:entry.meaning,...(old?{meaningCorrection:undefined}:{}),memberships:entry.memberships.filter((m:any)=>m.bookId===book&&m.unitId===unit)}]}}
it.each([2,3].flatMap(policy=>['online','offline'].map(platform=>({policy,platform}))))('reissues collision on $platform policy $policy and rejects every stale response',async({policy,platform})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  source.prepare("INSERT INTO words(headword,meaning_zh,source,meaning_source) VALUES ('similar','adv. 面朝下地','kb2022','manual')").run();installVocabulary(source,catalog(true));if(policy===3)activateEvidencePolicy(source,now);saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);const old=nextLearning(source,now).card!;const other=(source.prepare("SELECT id FROM words WHERE headword='similar'").get() as any).id;
  const oldText=entry.meaningCorrection.expected.split('\n')[0],option='adv. 面朝下地';expect(meaningsOverlap(oldText,option)).toBe(false);const snapshot=JSON.stringify([{id:old.wordId,text:oldText},{id:other,text:option},{id:0,text:'不记得'}]);source.prepare("UPDATE learning_issues SET mode='recognize',options_json=?,assisted=1 WHERE id=?").run(snapshot,old.issueId);
  const before=source.prepare('SELECT * FROM learning_day_words').all();let db:any=source;
  if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,catalog(false),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile)}else installVocabulary(db,catalog(false));
  expect(db.prepare('SELECT * FROM learning_day_words').all()).toEqual(before);const current=nextLearning(db,now).card!;expect(current.issueId).not.toBe(old.issueId);expect(current.assisted).toBe(true);expect(current.options).toEqual([{id:old.wordId,text:option},{id:0,text:'不记得'}]);
  for(const choiceId of [old.wordId,other])expect(()=>answerLearning(db,{policyVersion:policy,issueId:old.issueId,answerId:'stale-'+choiceId,choiceId} as any,now)).toThrow(/题目已更新/);
  expect(db.prepare('SELECT * FROM review_logs').all()).toEqual([]);const newAnswer={policyVersion:policy,issueId:current.issueId,answerId:'fresh',choiceId:old.wordId};const result=answerLearning(db,newAnswer as any,now);expect(result.correct).toBe(true);expect(result.assisted).toBe(true);expect(answerLearning(db,newAnswer as any,now)).toEqual(result);
  installVocabulary(db,catalog(false));expect(db.prepare('SELECT COUNT(*) AS n FROM learning_issues').get()).toEqual({n:2});
 }finally{mobile?.close();source.close()}
});
it.each([false,true])('V2 -> V3 cancellation does not fabricate exposure; assisted=%s',assisted=>{
 const db=openDb(':memory:');try{installVocabulary(db,catalog(true));saveVocabularySelection(db,{bookId:book,unitId:unit},now);startLearning(db,now);const old=nextLearning(db,now).card!;db.prepare("UPDATE learning_issues SET mode='recognize',options_json=?,assisted=? WHERE id=?").run(JSON.stringify([{id:old.wordId,text:entry.meaningCorrection.expected.split('\n')[0]},{id:0,text:'不记得'}]),Number(assisted),old.issueId);installVocabulary(db,catalog(false));activateEvidencePolicy(db,now);const events=db.prepare("SELECT kind,issue_id FROM learning_events WHERE issue_id=? ORDER BY kind").all(old.issueId) as any[];expect(events.some(e=>e.kind==='exposure')).toBe(false);}finally{db.close()}
});
it('offline failed save leaves stored pre-upgrade data recoverable on restart',async()=>{
 const source=openDb(':memory:');let first:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;let restarted:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{
  installVocabulary(source,catalog(true));saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);const old=nextLearning(source,now).card!;
  source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify([{id:old.wordId,text:entry.meaningCorrection.expected.split('\n')[0]},{id:0,text:'不记得'}]),old.issueId);
  const stored=source.serialize();const before=source.prepare('SELECT * FROM learning_day_words').all();first=await openBrowserDatabase(stored);
  await expect(prepareVocabularyDatabase(first,catalog(false),{createVocabularyBackup:async()=>{},save:async()=>{throw Error('disk full');}},true)).rejects.toThrow('disk full');
  first.close();first=undefined;restarted=await openBrowserDatabase(stored);let saved:Uint8Array|undefined;
  await prepareVocabularyDatabase(restarted,catalog(false),{createVocabularyBackup:async()=>{},save:async bytes=>{saved=bytes;}},true);
  const restored=asSharedDb(restarted),current=nextLearning(restored,now).card!;expect(current.issueId).not.toBe(old.issueId);expect(current.options[0].text).toBe(entry.meaning.split('\n')[0]);expect(restored.prepare('SELECT * FROM learning_day_words').all()).toEqual(before);expect(saved).toBeDefined();
 }finally{first?.close();restarted?.close();source.close();}
});

it.each([false,true].flatMap(answered=>['online','offline'].map(platform=>({answered,platform}))))('V2 assisted replacement counted once after V3 activation; answered=$answered platform=$platform',async({answered,platform})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  let db:any=source;
  installVocabulary(db,catalog(true));saveVocabularySelection(db,{bookId:book,unitId:unit},now);startLearning(db,now);const old=nextLearning(db,now).card!;
  db.prepare("UPDATE learning_issues SET mode='recognize',options_json=?,assisted=1 WHERE id=?").run(JSON.stringify([{id:old.wordId,text:entry.meaningCorrection.expected.split('\n')[0]},{id:0,text:'不记得'}]),old.issueId);
  if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());db=asSharedDb(mobile);await prepareVocabularyDatabase(mobile,catalog(false),{createVocabularyBackup:async()=>{},save:async()=>{}},true);}else installVocabulary(db,catalog(false));const current=nextLearning(db,now).card!;expect(current.issueId).not.toBe(old.issueId);expect(current.assisted).toBe(true);
  if(answered)answerLearning(db,{policyVersion:2,issueId:current.issueId,answerId:'replacement-answer',choiceId:current.wordId} as any,now);
  activateEvidencePolicy(db,now);
  const events=db.prepare("SELECT issue_id,kind FROM learning_events WHERE word_id=? AND mode='recognize' ORDER BY kind").all(old.wordId);
  expect(events).toEqual([{issue_id:current.issueId,kind:'exposure'},{issue_id:current.issueId,kind:'probe_failure'}]);
  const card=db.prepare("SELECT reps,lapses FROM cards WHERE word_id=? AND mode='recognize'").get(old.wordId) as any;
  expect(card.reps).toBe(1);expect(card.lapses).toBe(0);
 }finally{mobile?.close();source.close()}
});
