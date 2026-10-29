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
    "Log",
    "vi. 伐木\nvt. 切；伐木；航行\nn. 记录；航行日志；原木",
    "vt. 把……载入正式记录；记录；切；伐木；记录航行或飞行的距离或时间"
  ]
] as const;
const book='pep2019-optional-4',unit=book+':unit3',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?152:151,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

it.each(cases)('corrects $0 while preserving user-edited meanings', (key,old,first)=>{
 const entry=catalog.entries.find(e=>e.key===key)!;expect(entry.meaning.split('\n')[0]).toBe(first);expect(entry).toMatchObject({meaningCorrection:{expected:old}});
 for(const [text,source] of [['自定义','manual'],['不同的导入值','词库导入']] as const){const db=openDb(':memory:');try{installVocabulary(db,subset(key,old));db.prepare('UPDATE words SET meaning_zh=?,meaning_source=? WHERE headword=?').run(text,source,key);installVocabulary(db,subset(key));expect(db.prepare('SELECT meaning_zh,meaning_source FROM words WHERE headword=?').get(key)).toEqual({meaning_zh:text,meaning_source:source});}finally{db.close();}}
});

it.each(cases.flatMap(([key,old,first])=>[2,3].flatMap(policy=>['online','offline'].map(platform=>({key,old,first,policy,platform})))))
 ('reissues $key for $platform policy $policy, preserving plan and rejecting stale answers',async({key,old,first,policy,platform})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  installVocabulary(source,subset(key,old));if(policy===3)activateEvidencePolicy(source,now);saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);
  const card=nextLearning(source,now).card!;source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify([{id:card.wordId,text:old.split('\n')[0]},{id:0,text:'不记得'}]),card.issueId);
  const before=source.prepare('SELECT * FROM learning_day_words').all();let db:any=source;
  if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,subset(key),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile);}else installVocabulary(db,subset(key));
  expect(db.prepare('SELECT * FROM learning_day_words').all()).toEqual(before);const replacement=nextLearning(db,now).card!;expect(replacement.issueId).not.toBe(card.issueId);expect(replacement.wordId).toBe(card.wordId);expect(replacement.options[0].text).toBe(first);
  expect(()=>answerLearning(db,{policyVersion:policy,issueId:card.issueId,answerId:'old',choiceId:card.wordId} as any,now)).toThrow(/题目已更新/);
  const answer={policyVersion:policy,issueId:replacement.issueId,answerId:'new',choiceId:card.wordId};const result=answerLearning(db,answer as any,now);expect(result.correct).toBe(true);expect(answerLearning(db,answer as any,now)).toEqual(result);
 }finally{mobile?.close();source.close();}
});


it.each(cases)('protects flagged imported meaning for %s', (key,old)=>{
 const db=openDb(':memory:');try{installVocabulary(db,subset(key,old));db.prepare("UPDATE words SET meaning_flag='需复核' WHERE headword=?").run(key);installVocabulary(db,subset(key));expect(db.prepare('SELECT meaning_zh,meaning_flag FROM words WHERE headword=?').get(key)).toEqual({meaning_zh:old,meaning_flag:'需复核'});}finally{db.close();}
});

it.each(['online','offline'])('keeps both independent log identities and their histories on %s upgrade',async platform=>{
 const db=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  const upper=catalog.entries.find(e=>e.key==='Log')!,lower=catalog.entries.find(e=>e.key==='log')!;
  const both=(prior:boolean)=>({...catalog,version:prior?151:152,entries:[{...upper,...(prior?{meaning:cases[0][1],meaningCorrection:undefined}:{})},lower]});
  installVocabulary(db,both(true));const mappings=db.prepare("SELECT entry_key,word_id FROM vocabulary_entry_map WHERE entry_key IN ('Log','log') ORDER BY entry_key").all() as {entry_key:string,word_id:number}[];
  expect(mappings).toHaveLength(2);expect(mappings[0].word_id).not.toBe(mappings[1].word_id);
  for(const [i,m] of mappings.entries())db.prepare("INSERT INTO wrong_words(word_id,wrong_count,last_wrong_at,correct_days) VALUES (?,?,?,?)").run(m.word_id,i+2,'2026-10-01T00:00:00.000Z','[]');
  const history=db.prepare('SELECT * FROM wrong_words ORDER BY word_id').all();const lowerBefore=db.prepare('SELECT * FROM words WHERE id=?').get(mappings[1].word_id);let current:any=db;
  if(platform==='offline'){mobile=await openBrowserDatabase(db.serialize());await prepareVocabularyDatabase(mobile,both(false),{createVocabularyBackup:async()=>{},save:async()=>{}},true);current=asSharedDb(mobile);}else installVocabulary(current,both(false));
  expect(current.prepare("SELECT entry_key,word_id FROM vocabulary_entry_map WHERE entry_key IN ('Log','log') ORDER BY entry_key").all()).toEqual(mappings);
  expect(current.prepare('SELECT * FROM wrong_words ORDER BY word_id').all()).toEqual(history);
  expect(current.prepare('SELECT * FROM words WHERE id=?').get(mappings[1].word_id)).toEqual(lowerBefore);
  expect(current.prepare('SELECT meaning_zh FROM words WHERE id=?').get(mappings[0].word_id)).toEqual({meaning_zh:upper.meaning});
 }finally{mobile?.close();db.close();}
});
