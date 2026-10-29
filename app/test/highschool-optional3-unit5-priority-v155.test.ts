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
    "nursery",
    "n. 苗圃；托儿所；温床",
    "adj. 幼儿教育的"
  ],
  [
    "utter",
    "adj. 完全的；彻底的；无条件的\nvt. 发出，表达；发射",
    "vt. 出声；说；讲；发出；表达；发射"
  ],
  [
    "sympathetic",
    "n. 交感神经；容易感受的人\nadj. 同情的；交感神经的；共鸣的；赞同的；和谐的；合意的",
    "adj. 同情的；有同情心的；赞同的；交感神经的；共鸣的；和谐的；合意的"
  ],
  [
    "innocent",
    "n. 天真的人；笨蛋\nadj. 无辜的；无罪的；无知的",
    "adj. 天真无邪的；无辜的；无恶意的；无罪的；无知的"
  ],
  [
    "dominant",
    "n. 显性\nadj. 显性的；占优势的；支配的，统治的",
    "adj. 首要的；占支配地位的；显著的；显性的；占优势的；支配的；统治的"
  ],
  [
    "barren",
    "n. 荒地\nadj. 贫瘠的；不生育的；无益的；沉闷无趣的；空洞的",
    "adj. 贫瘠的；不结果实的；不生育的；无益的；沉闷无趣的；空洞的"
  ],
  [
    "The Crescent Moon",
    "无",
    "《新月集》"
  ],
  [
    "the Victorian era",
    "无",
    "维多利亚时代"
  ],
  [
    "Sonnets from the Portuguese",
    "无",
    "《葡萄牙人的十四行诗集》"
  ]
] as const;
const book='pep2019-optional-3',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?155:154,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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

it.each(cases.flatMap(([key,old])=>[2,3].flatMap(policy=>['online','offline'].map(platform=>({key,old,policy,platform})))))('keeps answered $key evidence on $platform policy $policy',async({key,old,policy,platform})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  installVocabulary(source,subset(key,old));if(policy===3)activateEvidencePolicy(source,now);saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);
  const card=nextLearning(source,now).card!;source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify([{id:card.wordId,text:old.split('\n')[0]},{id:0,text:'不记得'}]),card.issueId);
  const answer={policyVersion:policy,issueId:card.issueId,answerId:'before-upgrade',choiceId:card.wordId};const result=answerLearning(source,answer as any,now);
  const issues=source.prepare('SELECT * FROM learning_issues ORDER BY id').all();const days=source.prepare('SELECT * FROM learning_day_words ORDER BY word_id').all();let db:any=source;
  if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,subset(key),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile);}else installVocabulary(db,subset(key));
  expect(db.prepare('SELECT * FROM learning_issues ORDER BY id').all()).toEqual(issues);expect(db.prepare('SELECT * FROM learning_day_words ORDER BY word_id').all()).toEqual(days);expect(answerLearning(db,answer as any,now)).toEqual(result);
 }finally{mobile?.close();source.close();}
});
