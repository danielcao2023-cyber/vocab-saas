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
 ["illegal","n. 非法移民，非法劳工\nadj. [法] 非法的；违法的；违反规则的","adj. [法] 非法的；违法的；违反规则的"],
 ["immediately","conj. 一…就\nadv. 立即，立刻；直接地","adv. 立即，立刻；直接地"],
 ["concern","n. 关系；关心；关心的事；忧虑\nvt. 涉及，关系到；使担心","vt. 涉及，关系到；使担心"],
 ["concerned","v. 关心（concern的过去时和过去分词）；与…有关\nadj. 有关的；关心的","adj. 担心的；关切的；有关的；关心的"],
 ["make out","na. 理解；发现；起草；证明","看清；听清；分清；理解；发现；起草；证明"],
 ["observe","vt. 庆祝\nvt. 观察；遵守；说；注意到；评论\nvi. 观察；说；注意到；评论","vt. 观察；遵守；说；注意到；评论"],
 ["recover","n. 还原至预备姿势\nvt. 恢复；弥补；重新获得\nvi. 恢复；胜诉；重新得球","vi. 恢复；胜诉；重新得球"],
 ["remove","n. 移动；距离；搬家\nvt. 移动，迁移；开除；调动\nvi. 移动，迁移；搬家","vt. 去除；移开；脱去；移动；迁移；开除；调动"],
 ["due","n. 应付款；应得之物\nadj. 到期的；预期的；应付的；应得的\nadv. 正（置于方位词前）","adj. 由于（常用于 due to）；预期的；到期的；应付的；应得的"],
 ["stir","n. 搅拌；轰动\nvi. 搅动；传播；走动\nvt. 搅拌；激起；惹起","vt. 激起；搅动；搅拌；惹起"],
] as const;
const book='pep2019-compulsory-2',unit=book+':unit2',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?146:145,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

it('preserves IDs and all shared book memberships during the upgrade',()=>{
 const db=openDb(':memory:');try{
  const entries=cases.map(([key])=>catalog.entries.find(e=>e.key===key)!);
  installVocabulary(db,{...catalog,version:145,entries:entries.map((e,i)=>({...e,meaning:cases[i][1],meaningCorrection:undefined}))});
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
