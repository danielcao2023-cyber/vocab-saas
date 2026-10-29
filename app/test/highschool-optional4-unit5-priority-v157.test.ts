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
    "bounce",
    "n. 跳；弹力；活力\nvt. 弹跳；使弹起\nvi. 弹跳；弹起，反跳；弹回",
    "vi. & vt. （使）弹起；上下晃动"
  ],
  [
    "scenario",
    "n. 方案；情节；剧本；设想",
    "n. 可能发生的情况；设想；方案；情节；剧本"
  ],
  [
    "assemble",
    "vt. 集合，聚集；装配；收集\nvi. 集合，聚集",
    "vt. 组装；装配；集合；聚集；收集"
  ],
  [
    "profile",
    "n. 侧面；轮廓；外形；剖面；简况\nvt. 描…的轮廓；扼要描述\nvi. 给出轮廓",
    "n. 简介；概述；侧面轮廓；侧面；轮廓；外形；剖面；简况"
  ],
  [
    "graphic",
    "adj. 形象的；图表的；绘画似的",
    "n. 图表；图形；图画"
  ],
  [
    "estate",
    "n. 房地产；财产；身份",
    "n. 庄园；住宅区；工业区；房地产；财产；身份"
  ],
  [
    "justice",
    "n. 司法，法律制裁；正义；法官，审判员",
    "n. 公平；公正；合理；司法；法律制裁；正义；法官；审判员"
  ],
  [
    "socialist",
    "n. 社会主义者；社会党党员\nadj. 社会主义的",
    "adj. 社会主义的"
  ],
  [
    "communist",
    "n. 共产党员；共产主义者\nadj. 共产主义的",
    "adj. 共产主义的"
  ],
  [
    "dedicate",
    "vt. 致力；献身；题献",
    "vt. 把……奉献给；致力；献身；题献"
  ],
  [
    "attend to",
    "na. 照料(工作)",
    "关怀；照料；处理；照料工作"
  ],
  [
    "parking",
    "n. 停车\nadj. 停车的\nv. 停车（park的ing形式）",
    "n. 停车位；停车"
  ],
  [
    "fry",
    "n. 鱼苗；油炸食物\nvt. 油炸；油煎\nvi. 油炸；油煎",
    "n. 油煎的食物；鱼苗；油炸食物"
  ],
  [
    "intermediate",
    "n. [化学] 中间物；媒介\nadj. 中间的，中级的\nvi. 起媒介作用",
    "adj. 中级的；中等的；中间的"
  ],
  [
    "priority",
    "n. 优先；优先权；[数] 优先次序；优先考虑的事",
    "n. 优先事项；首要的事；优先；优先权；[数] 优先次序；优先考虑的事"
  ],
  [
    "collar",
    "n. 衣领；颈圈\nvt. 抓住；给…上领子；给…套上颈圈",
    "n. （动物）颈圈；衣领"
  ],
  [
    "finance",
    "n. 财政，财政学；金融\nvt. 负担经费，供给…经费\nvi. 筹措资金",
    "n. 资金；财政；金融；财政学"
  ],
  [
    "receipt",
    "n. 收到；收据；收入\nvt. 收到",
    "n. 收据；接收；收到；收入"
  ]
] as const;
const book='pep2019-optional-4',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?157:156,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
