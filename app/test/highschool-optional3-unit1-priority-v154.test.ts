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
    "primitive",
    "n. 原始人\nadj. 原始的，远古的；简单的，粗糙的",
    "adj. 原始的；远古的；简单的；粗糙的"
  ],
  [
    "dimension",
    "n. 方面;[数] 维；尺寸；次元；容积 vt. 标出尺寸\nadj. 规格的",
    "n. 维；规模；范围；方面；[数] 维度；尺寸；次元；容积"
  ],
  [
    "set apart from",
    "分开；区别；把……区分开",
    "使与众不同；使突出；使优于；分开；区别；把……区分开"
  ],
  [
    "noble",
    "adj. 高尚的；贵族的；惰性的；宏伟的\nn. 贵族\nvt. 抓住；逮捕",
    "n. 贵族；贵族成员"
  ],
  [
    "purchase",
    "n. 购买；紧握；起重装置\nvt. 购买；赢得\nvi. 购买东西",
    "vt. 购买；赢得"
  ],
  [
    "emerge",
    "vi. 浮现；摆脱；暴露",
    "vi. 出现；浮现；摆脱；暴露"
  ],
  [
    "arch",
    "n. 弓形，拱形；拱门\nadj. 主要的\nvt. 使…弯成弓形；用拱连接\nvi. 拱起；成为弓形",
    "vi. & vt. （使）呈弧形；（使）成拱形；拱起；用拱连接"
  ],
  [
    "permanent",
    "n. 烫发（等于permanent wave）\nadj. 永久的，永恒的；不变的",
    "adj. 永久的；长久的；永恒的；不变的"
  ],
  [
    "representative",
    "n. 代表；典型；众议员\nadj. 典型的，有代表性的；代议制的",
    "adj. 典型的；有代表性的；代议制的"
  ],
  [
    "animation",
    "n. 活泼，生气；激励；卡通片绘制",
    "n. 动画制作；动画片；卡通片绘制；活泼；生气；激励"
  ],
  [
    "exhibition",
    "n. 展览，显示；展览会；展览品",
    "n. 展览；展览会；表演；显示；展览品"
  ],
  [
    "ceramic",
    "n. 陶瓷；陶瓷制品\nadj. 陶瓷的；陶器的；制陶艺术的",
    "n. 陶瓷制品；陶瓷；制陶艺术（常用复数 ceramics）"
  ],
  [
    "entry",
    "n. 进入；入口；条目；登记；报关手续；对土地的侵占",
    "n. 加入；进入；参与；入口；条目；登记；报关手续；对土地的侵占"
  ],
  [
    "Buddhist",
    "n. 佛教徒\nadj. 佛教的",
    "adj. 佛教的"
  ],
  [
    "expansion",
    "n. 膨胀；阐述；扩张物",
    "n. 扩张；扩展；扩大；膨胀；阐述；扩张物"
  ],
  [
    "guarantee",
    "n. 保证；担保；保证人；保证书；抵押品\nvt. 保证；担保",
    "vt. 保证；确保；担保"
  ],
  [
    "contemporary",
    "n. 同时代的人；同时期的东西\nadj. 当代的；同时代的；属于同一时期的",
    "adj. 当代的；现代的；同时代的；属于同一时期的"
  ],
  [
    "worthy",
    "n. 杰出人物；知名人士\nadj. 值得的；有价值的；配得上的，相称的；可尊敬的；应…的",
    "adj. 值得的；有价值的；配得上的；相称的；可尊敬的；应……的"
  ]
] as const;
const book='pep2019-optional-3',unit=book+':unit1',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?154:153,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
