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
    "bitter",
    "n. 苦味；苦啤酒\nadj. 苦的；痛苦的；尖刻的；充满仇恨的\nvt. 使变苦\nadv. 激烈地；严寒刺骨地",
    "adj. 严寒的；激烈而不愉快的；味苦的；痛苦的；尖刻的；充满仇恨的"
  ],
  [
    "qualified",
    "v. 限制（qualify的过去分词）；描述；授权予\nadj. 合格的；有资格的",
    "adj. 符合资格的；具备所需知识或技能的；合格的；有资格的"
  ],
  [
    "steward",
    "n. 管家；乘务员；膳务员；工会管事\nvi. 当服务员；当管事\nvt. 管理",
    "n. 乘务员；服务员；管家；膳务员；工会管事"
  ],
  [
    "crush",
    "n. 粉碎；迷恋；压榨；拥挤的人群\nvt. 压碎；弄皱，变形；使…挤入\nvi. 挤；被压碎",
    "vt. 毁坏；压坏；压碎；弄皱；使变形；使挤入"
  ],
  [
    "sink",
    "n. 水槽；洗涤槽；污水坑\nvi. 下沉；消沉；渗透\nvt. 使下沉；挖掘；使低落",
    "vi. 沉没；下沉；下降；消沉；渗透"
  ],
  [
    "abandon",
    "n. 放任；狂热\nvt. 遗弃；放弃",
    "vt. 舍弃；抛弃；放弃；遗弃"
  ],
  [
    "cosy",
    "n. 保温罩\nadj. 舒适的；惬意的",
    "adj. 温馨的；舒适的；惬意的"
  ],
  [
    "bark",
    "n. 树皮；深青棕色；毛皮；皮肤；狗叫\nvt. 狗叫；尖叫；剥皮",
    "vi. （狗）吠叫"
  ],
  [
    "rough",
    "n. 艰苦；高低不平的地面；未经加工的材料；粗糙的部分\nadj. 粗糙的；粗略的；粗野的；艰苦的；未经加工的\nvt. 使粗糙；粗暴对待；草拟\nadv. 粗糙地；粗略地；粗暴地\nvi. 举止粗野",
    "adj. 汹涌的；粗糙的；粗略的；粗野的；艰苦的；未经加工的"
  ]
] as const;
const book='pep2019-optional-3',unit=book+':unit4',now=new Date('2026-10-29T01:00:00Z');
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
