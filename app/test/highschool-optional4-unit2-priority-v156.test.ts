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
    "foundation",
    "n. 基础；地基；基金会；根据；创立",
    "n. 创建；基础；地基；基金会；根据；创立"
  ],
  [
    "joint",
    "n. 关节；接缝；接合处，接合点；（牛，羊等的腿）大块肉\nadj. 共同的；连接的；联合的，合办的\nvt. 连接，贴合；接合；使有接头\nvi. 贴合；生节",
    "n. 公共场所（尤指价格低廉的饮食和娱乐场所）；关节；接缝；接合处；接合点；（牛、羊等的腿）大块肉"
  ],
  [
    "premier",
    "n. 总理，首相\nadj. 第一的；最初的",
    "adj. 最著名的；第一的；首要的；最初的"
  ],
  [
    "hollow",
    "n. 洞；山谷；窟窿\nadj. 空的；中空的，空腹的；凹的；虚伪的\nvt. 使成为空洞\nadv. 彻底地；无用地\nvi. 形成空洞",
    "adj. 中空的；空心的；空的；空腹的；凹的；虚伪的"
  ],
  [
    "pitch",
    "n. 沥青；音高；程度；树脂；倾斜；投掷；球场\nvt. 投；掷；定位于；用沥青涂；扎营；向前倾跌\nvi. 倾斜；投掷；搭帐篷；坠落",
    "n. 音高；沥青；程度；树脂；倾斜；投掷；球场"
  ],
  [
    "getaway",
    "n. 逃走；逃跑；短假；适合旅行的地方",
    "n. 适合度假的地方；逃走；逃跑；短假；适合旅行的地方"
  ],
  [
    "sponsor",
    "n. 赞助者；主办者；保证人\nvt. 赞助；发起",
    "vt. 倡议；赞助；主办；发起"
  ],
  [
    "kiwi",
    "n. 猕猴桃；几维（一种新西兰产的无翼鸟）；新西兰人",
    "n. 几维（新西兰鸟）；猕猴桃；新西兰人"
  ],
  [
    "geyser",
    "n. 喷泉；[水文] 间歇泉；（英）烧水锅炉",
    "n. 间歇泉；喷泉；（英）烧水锅炉"
  ],
  [
    "sulphuric pool",
    "含硫酸的池塘（字面义）",
    "硫黄池（教材地热景点语境）"
  ],
  [
    "pouch",
    "n. 小袋；育儿袋；烟草袋\nvi. 成袋状\nvt. 使成袋状；把…装入袋中",
    "n. 育儿袋；小袋子；荷包；小袋；烟草袋"
  ],
  [
    "temporary",
    "n. 临时工，临时雇员\nadj. 暂时的，临时的",
    "adj. 暂时的；短暂的；临时的"
  ],
  [
    "phase",
    "n. 月相\nn. （月亮的）盈亏\nn. 时期",
    "n. 阶段；时期；月相；（月亮的）盈亏"
  ],
  [
    "license",
    "n. 执照，许可证；特许\nvt. 许可；特许；发许可证给",
    "vt. 批准；许可；特许；发许可证给"
  ],
  [
    "grand",
    "n. 大钢琴；一千美元\nadj. 宏伟的；豪华的；极重要的",
    "adj. 大；宏大的；宏伟的；豪华的；极重要的"
  ]
] as const;
const book='pep2019-optional-4',unit=book+':unit2',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?156:155,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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

it.each([2,3].flatMap(policy=>['online','offline'].map(platform=>({policy,platform}))))('upgrades historic 无 for $platform policy $policy and reissues old card',async({policy,platform})=>{
 const key='sulphuric pool',old='无';const e=catalog.entries.find(x=>x.key===key)!;
 expect(e.meaningCorrection).toEqual({expected:'含硫酸的池塘（字面义）',previous:['无']});
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  installVocabulary(source,{...subset(key,old),version:130});if(policy===3)activateEvidencePolicy(source,now);saveVocabularySelection(source,{bookId:book,unitId:unit},now);startLearning(source,now);
  const card=nextLearning(source,now).card!;source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify([{id:card.wordId,text:old},{id:0,text:'不记得'}]),card.issueId);const before=source.prepare('SELECT * FROM learning_day_words').all();let db:any=source;
  if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,subset(key),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile);}else installVocabulary(db,subset(key));
  expect(db.prepare('SELECT * FROM learning_day_words').all()).toEqual(before);const replacement=nextLearning(db,now).card!;expect(replacement.issueId).not.toBe(card.issueId);expect(replacement.options[0].text).toBe('硫黄池（教材地热景点语境）');expect(()=>answerLearning(db,{policyVersion:policy,issueId:card.issueId,answerId:'stale',choiceId:card.wordId} as any,now)).toThrow(/题目已更新/);
 }finally{mobile?.close();source.close();}
});
