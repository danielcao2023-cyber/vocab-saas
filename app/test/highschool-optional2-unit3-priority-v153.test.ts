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
    "cuisine",
    "n. 烹饪，烹调法",
    "n. 菜肴；风味；烹饪；烹调法"
  ],
  [
    "stuff",
    "n. 东西；材料；填充物；素材资料\nvt. 塞满；填塞；让吃饱\nvi. 吃得过多",
    "vt. 填满；把……塞进；塞满；填塞；让吃饱"
  ],
  [
    "exceptional",
    "n. 超常的学生\nadj. 异常的，例外的",
    "adj. 特别的；罕见的；异常的；例外的"
  ],
  [
    "consume",
    "vt. 消耗，消费；使…着迷；挥霍\nvi. 耗尽，毁灭；耗尽生命",
    "vt. 吃；喝；饮；消耗；消费；使着迷；挥霍"
  ],
  [
    "ham",
    "adj. 过火的；做作的\nvi. 表演过火\nvt. 演得过火\nn. 火腿；业余无线电爱好者；蹩脚演员",
    "n. 火腿；业余无线电爱好者；蹩脚演员"
  ],
  [
    "stable",
    "n. 马厩；牛棚\nadj. 稳定的；牢固的；坚定的\nvt. 赶入马房\nvi. 被关在马厩",
    "adj. 稳定的；稳重的；牢固的；坚定的"
  ],
  [
    "somewhat",
    "n. 几分；某物\nadv. 有点；多少；几分；稍微",
    "adv. 有点；稍微；多少；几分"
  ],
  [
    "regardless",
    "adj. 不管的；不顾的；不注意的\nadv. 不顾后果地；不管怎样，无论如何；不惜费用地",
    "adv. 不顾；不加理会；不顾后果地；不管怎样；无论如何；不惜费用地"
  ],
  [
    "dairy",
    "n. 奶制品；乳牛；制酪场；乳品店；牛奶及乳品业\nadj. 乳品的；牛奶的；牛奶制的；产乳的",
    "adj. 奶制的；乳品（业）的；牛奶的；牛奶制的；产乳的"
  ],
  [
    "ideal",
    "n. 理想；典范\nadj. 理想的；完美的；想象的；不切实际的",
    "adj. 完美的；理想的；想象的；不切实际的"
  ],
  [
    "fundamental",
    "n. 基本原理；基本原则\nadj. 基本的，根本的",
    "adj. 根本的；基础的；基本的"
  ],
  [
    "chew",
    "n. 咀嚼；咀嚼物\nvi. 细想，深思\nvt. 嚼碎，咀嚼",
    "vi. & vt. 咀嚼；嚼碎"
  ],
  [
    "overall",
    "adj. 全部的；全体的；一切在内的\nadv. 全部地；总的说来\nn. 工装裤；罩衫",
    "adv. 总体上；大致上；全部地；总的说来"
  ],
  [
    "Kazak",
    "n. 哈萨克族；哈萨克人",
    "adj. 哈萨克族的"
  ]
] as const;
const book='pep2019-optional-2',unit=book+':unit3',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?153:152,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
