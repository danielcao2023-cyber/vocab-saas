import {expect,it} from 'vitest';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
const all=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
const rent=all.entries.find((e:any)=>e.key==='rent');
const old='n. 租金\nvt. 出租；租用；租借\nvi. 租；出租',mid='租金\n租用；出租',future='租用；出租\n租金';
it('rent catalog retains the audited published history and new value',()=>{expect(rent.meaning).toBe(future);expect(rent.meaningCorrection).toEqual({expected:mid,previous:[old]});});
const book='pep2019-compulsory-1',unit=book+':unit2',now=new Date('2026-10-29T01:00:00Z');
const catalog=(version:number,meaning:string,correction?:unknown)=>({...all,version,books:all.books.filter((b:any)=>b.id===book),units:all.units.filter((u:any)=>u.bookId===book),entries:[{...rent,meaning,meaningCorrection:correction,memberships:rent.memberships.filter((m:any)=>m.bookId===book&&m.unitId===unit)}]});
it.each([2,3].flatMap(policy=>['online','offline'].flatMap(platform=>['direct','sequential'].map(path=>({policy,platform,path})))) )('historical rent value upgrades $path on $platform policy $policy',async({policy,platform,path})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{
  installVocabulary(source,catalog(130,old));if(policy===3)activateEvidencePolicy(source,now);saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);const prior=nextLearning(source,now).card!;
  const options=JSON.stringify([{id:prior.wordId,text:old.split('\n')[0]},{id:0,text:'不记得'}]);source.prepare("UPDATE learning_issues SET mode='recognize',options_json=?,assisted=1 WHERE id=?").run(options,prior.issueId);
  let db:any=source;if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());db=asSharedDb(mobile);}
  const upgrade=async(c:any)=>platform==='offline'?prepareVocabularyDatabase(mobile!,c,{createVocabularyBackup:async()=>{},save:async()=>{}},true):installVocabulary(db,c);
  if(path==='sequential')await upgrade(catalog(131,mid,{expected:old}));
  const previousCard=nextLearning(db,now).card!;
  await upgrade(catalog(132,future,{expected:mid,previous:[old]}));
  expect(db.prepare('SELECT meaning_zh FROM words WHERE id=?').get(prior.wordId)).toEqual({meaning_zh:future});
  const replacement=nextLearning(db,now).card!;expect(replacement.issueId).not.toBe(previousCard.issueId);expect(replacement.assisted).toBe(true);expect(replacement.options[0].text).toBe(future.split('\n')[0]);
  expect(()=>answerLearning(db,{policyVersion:policy,issueId:previousCard.issueId,answerId:'stale',choiceId:prior.wordId} as any,now)).toThrow(/题目已更新/);
  const input={policyVersion:policy,issueId:replacement.issueId,answerId:'new',choiceId:prior.wordId};const result=answerLearning(db,input as any,now);expect(result.correct).toBe(true);expect(answerLearning(db,input as any,now)).toEqual(result);
 }finally{mobile?.close();source.close()}
});
it.each([old,mid])('manual text equal to approved historic value stays unchanged: %s',value=>{
 const db=openDb(':memory:');try{installVocabulary(db,catalog(130,value));const id=(db.prepare("SELECT id FROM words WHERE headword='rent'").get() as any).id;db.prepare("UPDATE words SET meaning_source='manual' WHERE id=?").run(id);const snapshot=JSON.stringify([{id,text:value.split('\n')[0]},{id:0,text:'不记得'}]);db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('manual','2026-10-29',?,'recognize',?,?)").run(id,snapshot,now.toISOString());installVocabulary(db,catalog(132,future,{expected:mid,previous:[old]}));expect(db.prepare('SELECT meaning_zh,meaning_source FROM words WHERE id=?').get(id)).toEqual({meaning_zh:value,meaning_source:'manual'});expect(db.prepare("SELECT options_json,answered_at FROM learning_issues WHERE id='manual'").get()).toEqual({options_json:snapshot,answered_at:null});}finally{db.close()}
});
it.each([{previous:[]},{previous:['']},{previous:['old',3]},{previous:['x'.repeat(16001)]},{previous:'bad'}])('rejects invalid historic correction list',({previous})=>{const db=openDb(':memory:');try{expect(()=>installVocabulary(db,catalog(132,future,{expected:mid,previous}))).toThrow(/Invalid meaning correction/);}finally{db.close()}});
it('repairs a historic unanswered option after the latest correction already installed, once only',()=>{
 const db=openDb(':memory:');try{const latest=catalog(132,future,{expected:mid,previous:[old]});installVocabulary(db,catalog(130,old));installVocabulary(db,latest);const id=(db.prepare("SELECT id FROM words WHERE headword='rent'").get() as any).id;const snapshot=JSON.stringify([{id,text:old.split('\n')[0]},{id:0,text:'不记得'}]);db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('stale','2026-10-29',?,'recognize',?,?)").run(id,snapshot,now.toISOString());installVocabulary(db,latest);const rows=db.prepare('SELECT id,answered_at,options_json FROM learning_issues').all() as any[];expect(rows).toHaveLength(2);expect(rows.find(x=>x.id==='stale').options_json).toBe(snapshot);expect(JSON.parse(rows.find(x=>!x.answered_at).options_json)[0].text).toBe(future.split('\n')[0]);installVocabulary(db,latest);expect(db.prepare('SELECT COUNT(*) AS n FROM learning_issues').get()).toEqual({n:2});}finally{db.close()}
});
