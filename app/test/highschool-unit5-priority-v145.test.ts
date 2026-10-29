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
 ["based","v. 立基于，以…为基础（base的过去式和过去分词）\nadj. 有根基的","adj. 以……为基础的；有根基的"],
 ["date back","un. 过时；始于","追溯；始于"],
 ["no matter who","na. 不管怎谁","无论谁；不管谁"],
 ["no matter what","na. 不管怎什么","无论什么；不管什么"],
 ["appreciate","vi. 增值；涨价\nvt. 欣赏；感激；领会；鉴别","vt. 欣赏；重视；感激；领会；鉴别"],
 ["specific","n. 特性；细节；特效药\nadj. 特殊的，特定的；明确的；详细的；[药] 具有特效的","adj. 特定的；明确的；具体的；特殊的；详细的；[药] 具有特效的"],
] as const;
const book='pep2019-compulsory-1',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?145:144,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

it('preserves shared exam-book IDs and memberships when upgrading meanings',()=>{
 const db=openDb(':memory:');try{
  const entries=cases.map(([key])=>catalog.entries.find(e=>e.key===key)!);
  installVocabulary(db,{...catalog,version:144,entries:entries.map((e,i)=>({...e,meaning:cases[i][1],meaningCorrection:undefined}))});
  const ids=db.prepare('SELECT * FROM vocabulary_entry_map ORDER BY entry_key').all();
  const memberships=db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id,book_id').all();
  expect(memberships.length).toBeGreaterThan(entries.length);
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare('SELECT * FROM vocabulary_entry_map ORDER BY entry_key').all()).toEqual(ids);
  expect(db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id,book_id').all()).toEqual(memberships);
 }finally{db.close();}
});

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
