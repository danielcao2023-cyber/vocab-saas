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
    "complex",
    "n. 复合体；综合设施\nadj. 复杂的；合成的",
    "adj. 复杂的；难懂的；合成的"
  ],
  [
    "recall",
    "n. 召回；回忆；撤消\nvt. 召回；回想起，记起；取消",
    "vt. & vi. 回想起；记起"
  ],
  [
    "feel at home",
    "na. 舒松；“be/feel/look at home”的变体",
    "感觉舒适自在；舒松；（be/feel/look at home 的表达形式）"
  ],
  [
    "engage",
    "vi. 从事；答应，保证；交战；啮合\nvt. 吸引，占用；使参加；雇佣；使订婚；预定",
    "vi. 参加；从事；答应；保证；交战；啮合"
  ],
  [
    "exposure",
    "n. 暴露；曝光；揭露；陈列",
    "n. 接触；体验；暴露；曝光；揭露；陈列"
  ],
  [
    "expose",
    "vt. 揭露，揭发；使曝光；显示",
    "vt. 使接触；使体验；使暴露；揭露；揭发；使曝光；显示"
  ],
  [
    "grasp",
    "n. 抓住；理解；控制\nvi. 抓\nvt. 抓住；领会",
    "vt. 理解；领会；抓紧；抓住"
  ],
  [
    "dramatic",
    "adj. 戏剧的；急剧的；引人注目的；激动人心的",
    "adj. 巨大的；突然的；急剧的；戏剧的；引人注目的；激动人心的"
  ],
  [
    "expense",
    "n. 损失，代价；消费；开支\nvt. 向…收取费用\nvi. 被花掉",
    "n. 费用；花费；开销；损失；代价；消费；开支"
  ],
  [
    "surrounding",
    "n. 环境，周围的事物\nadj. 周围的，附近的",
    "adj. 周围的；附近的"
  ],
  [
    "gain",
    "n. 增加；利润；收获\nvi. 增加；获利\nvt. 获得；增加；赚到",
    "vt. 获得；赢得；增加；赚到"
  ],
  [
    "initiative",
    "n. 主动权；首创精神\nadj. 主动的；自发的；起始的",
    "n. 倡议；新方案；主动权；首创精神"
  ],
  [
    "side with",
    "v. 援助；偏袒",
    "v. 支持；站在……一边；援助；偏袒"
  ],
  [
    "in summary",
    "adv. 扼要",
    "总的来说；总之；扼要地"
  ]
] as const;
const book='pep2019-optional-2',unit=book+':unit2',now=new Date('2026-10-29T01:00:00Z');
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
