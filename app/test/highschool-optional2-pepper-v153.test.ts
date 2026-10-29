import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
import catalog from '../data/vocabulary/catalog.json';

const cases=[
  [
    "pepper",
    "n. 胡椒粉, 胡椒, 辣椒",
    "n. 甜椒；灯笼椒；胡椒粉；胡椒；辣椒"
  ]
] as const;
const book='pep2019-optional-2',unit=book+':unit3',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?153:152,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined,kb2022MeaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

it.each(cases)('corrects $0 while preserving user-edited meanings', (key,old,first)=>{
 const entry=catalog.entries.find(e=>e.key===key)!;expect(entry.kb2022MeaningCorrection!.meaning.split('\n')[0]).toBe(first);expect(entry).toMatchObject({kb2022MeaningCorrection:{expected:old}});
 for(const [text,source] of [['自定义','manual'],['不同的导入值','词库导入']] as const){const db=openDb(':memory:');try{installVocabulary(db,subset(key,old));db.prepare("UPDATE words SET source='kb2022',meaning_zh=?,meaning_source=? WHERE headword=?").run(text,source,key);installVocabulary(db,subset(key));expect(db.prepare('SELECT meaning_zh,meaning_source FROM words WHERE headword=?').get(key)).toEqual({meaning_zh:text,meaning_source:source});}finally{db.close();}}
});

it.each(cases.flatMap(([key,old,first])=>[2,3].flatMap(policy=>['online','offline'].map(platform=>({key,old,first,policy,platform})))))
 ('reissues $key for $platform policy $policy, preserving plan and rejecting stale answers',async({key,old,first,policy,platform})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  installVocabulary(source,subset(key,old));source.prepare("UPDATE words SET source='kb2022',meaning_source='ecdict',meaning_zh=? WHERE headword=?").run(old,key);if(policy===3)activateEvidencePolicy(source,now);saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);
  const card=nextLearning(source,now).card!;source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify([{id:card.wordId,text:old.split('\n')[0]},{id:0,text:'不记得'}]),card.issueId);
  const before=source.prepare('SELECT * FROM learning_day_words').all();let db:any=source;
  if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,subset(key),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile);}else installVocabulary(db,subset(key));
  expect(db.prepare('SELECT * FROM learning_day_words').all()).toEqual(before);const replacement=nextLearning(db,now).card!;expect(replacement.issueId).not.toBe(card.issueId);expect(replacement.wordId).toBe(card.wordId);expect(replacement.options[0].text).toBe(first);
  expect(()=>answerLearning(db,{policyVersion:policy,issueId:card.issueId,answerId:'old',choiceId:card.wordId} as any,now)).toThrow(/题目已更新/);
  const answer={policyVersion:policy,issueId:replacement.issueId,answerId:'new',choiceId:card.wordId};const result=answerLearning(db,answer as any,now);expect(result.correct).toBe(true);expect(answerLearning(db,answer as any,now)).toEqual(result);
 }finally{mobile?.close();source.close();}
});

it.each(cases)('does not overwrite flagged ECDICT or unrelated imported value for %s', (key,old)=>{
 for(const [value,flag] of [[old,'需复核'],['其他版本词典释义',null]] as const){const db=openDb(':memory:');try{
  installVocabulary(db,subset(key,old));db.prepare("UPDATE words SET source='kb2022',meaning_zh=?,meaning_source='ecdict',meaning_flag=? WHERE headword=?").run(value,flag,key);
  installVocabulary(db,subset(key));expect(db.prepare('SELECT meaning_zh,meaning_flag FROM words WHERE headword=?').get(key)).toEqual({meaning_zh:value,meaning_flag:flag});
 }finally{db.close();}}
});

it.each(cases)('preserves corrected %s through KB re-import', async (key,old)=>{
 const {upsertWords,upsertCurriculum}=await import('../server/src/import');
 for(const path of ['legacy','curriculum'] as const){const db=openDb(':memory:');try{
  installVocabulary(db,subset(key,old));db.prepare("UPDATE words SET source='kb2022',meaning_zh=?,meaning_source='ecdict',meaning_flag=NULL WHERE headword=?").run(old,key);installVocabulary(db,subset(key));
  const before=db.prepare('SELECT meaning_zh,meaning_source,meaning_flag FROM words WHERE headword=?').get(key);
  const list=[{headword:key,level:'三级'}] as any;const dict=new Map([[key,{phonetic:'',translation:'不同词典新义',pos:'',bnc:0,frq:0}]]);
  if(path==='legacy')upsertWords(db,list,dict as any,'kb2022',false);else upsertCurriculum(db,list,dict as any,'kb2022',{expected:{total:1,level2:0,level3:1}});
  expect(db.prepare('SELECT meaning_zh,meaning_source,meaning_flag FROM words WHERE headword=?').get(key)).toEqual(before);
 }finally{db.close();}}
});

it.each(cases.flatMap(([key,old])=>[2,3].flatMap(policy=>['online','offline'].map(platform=>({key,old,policy,platform})))))('keeps answered $key evidence on $platform policy $policy',async({key,old,policy,platform})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  installVocabulary(source,subset(key,old));source.prepare("UPDATE words SET source='kb2022',meaning_source='ecdict',meaning_zh=? WHERE headword=?").run(old,key);if(policy===3)activateEvidencePolicy(source,now);saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);
  const card=nextLearning(source,now).card!;source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify([{id:card.wordId,text:old.split('\n')[0]},{id:0,text:'不记得'}]),card.issueId);
  const answer={policyVersion:policy,issueId:card.issueId,answerId:'before-upgrade',choiceId:card.wordId};const result=answerLearning(source,answer as any,now);
  const issues=source.prepare('SELECT * FROM learning_issues ORDER BY id').all();const days=source.prepare('SELECT * FROM learning_day_words ORDER BY word_id').all();let db:any=source;
  if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,subset(key),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile);}else installVocabulary(db,subset(key));
  expect(db.prepare('SELECT * FROM learning_issues ORDER BY id').all()).toEqual(issues);expect(db.prepare('SELECT * FROM learning_day_words ORDER BY word_id').all()).toEqual(days);expect(answerLearning(db,answer as any,now)).toEqual(result);
 }finally{mobile?.close();source.close();}
});
