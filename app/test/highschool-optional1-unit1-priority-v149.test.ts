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
    "committed",
    "v. 承诺；委托；干坏事；付诸（commit的过去分词）\nadj. 坚定的；效忠的；承担义务的",
    "adj. 尽心尽力的；坚定的；坚信的"
  ],
  [
    "commit",
    "vt. 犯罪，做错事；把...交托给；指派…作战；使…承担义务",
    "v. 承诺；保证；投入（常用于 commit to 或 commit oneself to）"
  ],
  [
    "academic",
    "n. 大学生，大学教师；学者\nadj. 学术的；理论的；学院的",
    "adj. 学业的；学术的"
  ],
  [
    "botanical",
    "n. 植物性药材\nadj. 植物学的",
    "adj. 植物学的"
  ],
  [
    "gentle",
    "n. 蛆，饵\nadj. 温和的；文雅的\nvt. 使温和，使驯服",
    "adj. 温柔的；文静的；温和的"
  ],
  [
    "objective",
    "adj. 客观的；目标的；宾格的\nn. 目的；目标；[光] 物镜；宾格",
    "n. 目标；目的"
  ],
  [
    "liquid",
    "adj. 液体的；清澈的；明亮的；易变的\nn. 液体，流体；流音",
    "n. 液体"
  ],
  [
    "device",
    "n. 装置；策略；图案",
    "n. 方法；技巧；装置；仪器"
  ],
  [
    "sum",
    "n. 金额；总数\nvt. 总结；合计\nvi. 概括",
    "vi. 总结；概括（常用 sum up）"
  ],
  [
    "draft",
    "n. 汇票；草稿；选派；（尤指房间、烟囱、炉子等供暖系统中的）（小股）气流\nvt. 起草；制定；征募\nvi. 拟稿；绘样；作草图\nadj. 初步画出或（写出）的；（设计、草图、提纲或版本）正在起草中的，草拟的；以草稿形式的；草图的",
    "n. 草稿；草案"
  ],
  [
    "Swiss",
    "n. 瑞士人；瑞士腔调\nadj. 瑞士的；瑞士人的；瑞士风格的",
    "adj. 瑞士的"
  ]
] as const;
const book='pep2019-optional-1',unit=book+':unit1',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?149:148,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
