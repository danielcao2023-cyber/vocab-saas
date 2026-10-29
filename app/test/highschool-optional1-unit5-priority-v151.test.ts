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
    "estimate",
    "n. 估计，估价；判断，看法\nvt. 估计，估量；判断，评价\nvi. 估计，估价",
    "vt. 估计；估价；估量；判断；评价"
  ],
  [
    "digest",
    "n. 文摘；摘要\nvt. 消化；吸收；融会贯通\nvi. 消化",
    "vt. & vi. 消化"
  ],
  [
    "hybrid",
    "n. 杂种，混血儿；混合物\nadj. 混合的；杂种的",
    "n. 杂交植（动）物；合成物；混合动力车；杂种；混血儿；混合物"
  ],
  [
    "tackle",
    "n. 滑车；装备；用具；扭倒\nvi. 扭倒；拦截抢球\nvt. 处理；抓住；固定；与…交涉",
    "vt. 解决（难题）；应付（局面）；处理；抓住；固定；与……交涉"
  ],
  [
    "boost",
    "n. 推动；帮助；宣扬\nvi. 宣扬；偷窃\nvt. 促进；增加；支援",
    "vt. 使增长；促进；使兴旺；增加；支援"
  ],
  [
    "attain",
    "n. 成就\nvt. 达到，实现；获得；到达\nvi. 达到；获得；到达",
    "vt. （通常经过努力）获得；达到；实现；到达"
  ],
  [
    "domestic",
    "n. 国货；佣人\nadj. 国内的；家庭的；驯养的；一心只管家务的",
    "adj. 本国的；国内的；家用的；家庭的；驯养的；一心只管家务的"
  ],
  [
    "generate",
    "vt. 使形成；发生；生殖；产生物理反应",
    "vt. 产生；引起；使形成；发生；生殖；产生物理反应"
  ],
  [
    "strain",
    "n. 张力；拉紧；负担；扭伤；血缘\nvt. 拉紧；滥用；滤去；竭力\nvi. 拉紧；尽力\nn. （植物、动物的）品种；种类",
    "n. （动、植物的）系；品种；种类；拉伤；压力；张力；拉紧；负担；扭伤；血缘"
  ],
  [
    "extension",
    "n. 延长；延期；扩大；伸展；电话分机",
    "n. 扩建部分；扩大；电话分机；延长；延期；伸展"
  ],
  [
    "chemical",
    "n. 化学制品，化学药品\nadj. 化学的",
    "adj. 与化学有关的；化学的"
  ],
  [
    "essential",
    "n. 本质；要素；要点；必需品\nadj. 基本的；必要的；本质的；精华的",
    "adj. 完全必要的；极其重要的；基本的；必要的；本质的；精华的"
  ],
  [
    "organic",
    "adj. [有化] 有机的；组织的；器官的；根本的",
    "adj. 有机的；不使用化肥的（农业语境）；组织的；器官的；根本的"
  ]
] as const;
const book='pep2019-optional-1',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?151:150,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
