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
    "test out",
    "na. 同“test”",
    "检验；测试"
  ],
  [
    "bonus",
    "n. 奖金；红利；额外津贴",
    "n. 意外收获；奖金；红利；额外津贴"
  ],
  [
    "absurd",
    "n. 荒诞；荒诞作品\nadj. 荒谬的；可笑的",
    "adj. 荒谬的；荒唐的；可笑的"
  ],
  [
    "appointment",
    "n. 任命；约定；任命的职位",
    "n. 预约；约会；委任；任命；约定；任命的职位"
  ],
  [
    "nail",
    "vt. 钉；使固定；揭露\nn. [解剖] 指甲；钉子",
    "n. 指甲；趾甲；钉子"
  ],
  [
    "suspend",
    "vt. 延缓，推迟；使暂停；使悬浮\nvi. 悬浮；禁赛",
    "vt. 悬；挂；暂停；暂缓；延缓；推迟；使悬浮"
  ],
  [
    "weekly",
    "n. 周刊\nadj. 每周的；周刊的；一周一次的\nadv. 每周一次；逐周",
    "adj. 每周的；周刊的；一周一次的"
  ],
  [
    "on a ... basis",
    "无",
    "根据；以……的方式或基准"
  ],
  [
    "venue",
    "n. 审判地；犯罪地点；发生地点；集合地点",
    "n. 活动场地（如音乐厅、会场等）；审判地；犯罪地点；发生地点；集合地点"
  ],
  [
    "alien",
    "n. 外国人，外侨；外星人\nadj. 外国的；相异的，性质不同的；不相容的\nvt. 让渡，转让",
    "n. 外星人（生物）；外国人；外侨"
  ],
  [
    "blurred",
    "v. 玷污；使…模糊不清；使感觉迟钝（blur的过去式和过去分词）\nadj. 模糊不清的；被弄污的",
    "adj. 模糊不清的；难以区分的；被弄污的"
  ],
  [
    "superior",
    "n. 上级，长官；优胜者，高手；长者\nadj. 上级的；优秀的，出众的；高傲的",
    "adj. 更好的；占优势的；级别或重要性更高的；上级的；优秀的；出众的；高傲的"
  ],
  [
    "take over",
    "na. 接管；继承",
    "占上风；取而代之；接管；接手；继承"
  ],
  [
    "division",
    "n. [数] 除法；部门；分配；分割；师（军队）；赛区",
    "n. 分开；分隔；差异；[数] 除法；部门；分配；分割；师（军队）；赛区"
  ],
  [
    "puff",
    "n. 粉扑；泡芙；蓬松；一阵喷烟；肿块；吹嘘，宣传广告\nvt. 喷出，张开；使膨胀；夸张；使骄傲自满\nvi. 膨胀；张开；鼓吹；夸张",
    "n. （烟、气等的）一缕；少量；喘息；粉扑；泡芙；蓬松；一阵喷烟；肿块；吹嘘；宣传广告"
  ],
  [
    "random",
    "n. 随意\nadj. [数] 随机的；任意的；胡乱的\nadv. 胡乱地",
    "adj. [数] 随机的；任意的；胡乱的；不可思议的（非正式）"
  ],
  [
    "maximum",
    "n. [数] 极大，最大限度；最大量\nadj. 最高的；最多的；最大极限的",
    "adj. 最大极限的；最高的；最多的"
  ],
  [
    "jolt",
    "vt. 使颠簸；使震惊；使摇动\nvi. 摇晃；颠簸而行\nn. 颠簸；摇晃；震惊；严重挫折",
    "n. 震动；摇晃；颠簸；震惊；严重挫折"
  ],
  [
    "flip",
    "n. 弹；筋斗\nvi. 用指轻弹；蹦跳\nadj. 无礼的；轻率的\nvt. 掷；轻击",
    "vt. & vi. （使）快速翻转；（用手指）轻抛"
  ],
  [
    "stun",
    "n. 昏迷；打昏；惊倒；令人惊叹的事物\nvt. 使震惊；打昏；给以深刻的印象",
    "vt. 使震惊；使昏迷；打昏；给以深刻的印象"
  ],
  [
    "mud",
    "vt. 弄脏；用泥涂\nvi. 钻入泥中\nn. 泥；诽谤的话；无价值的东西",
    "n. 泥；泥浆；诽谤的话；无价值的东西"
  ]
] as const;
const book='pep2019-optional-4',unit=book+':unit1',now=new Date('2026-10-29T01:00:00Z');
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
