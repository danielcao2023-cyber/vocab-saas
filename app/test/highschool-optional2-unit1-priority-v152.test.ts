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
    "frustrated",
    "v. 挫败；阻挠（frustrate的过去式和过去分词形式）\nadj. 失意的，挫败的；泄气的",
    "adj. 懊恼的；沮丧的；失意的；挫败的；泄气的"
  ],
  [
    "contradictory",
    "n. 对立物；矛盾因素\nadj. 矛盾的；反对的；反驳的；抗辩的",
    "adj. 相互矛盾的；对立的；反对的；反驳的；抗辩的"
  ],
  [
    "germ",
    "n. [植] 胚芽，萌芽；细菌\nvi. 萌芽",
    "n. 细菌；微生物；[植] 胚芽；萌芽"
  ],
  [
    "subscribe",
    "vt. 签署；赞成；捐助\nvi. 订阅；捐款；认购；赞成；签署",
    "vi. 认购；订阅（常用 subscribe to）；捐款；赞成；签署"
  ],
  [
    "blame",
    "n. 责备；责任；过失\nvt. 责备；归咎于",
    "vt. 责备；把……归咎于"
  ],
  [
    "raw",
    "n. 擦伤处\nadj. 生的；未加工的；阴冷的；刺痛的；擦掉皮的；无经验的；（在艺术等方面）不成熟的\nvt. 擦伤",
    "adj. 未煮的；生的；未加工的；阴冷的；刺痛的；擦掉皮的；无经验的；（艺术等方面）不成熟的"
  ],
  [
    "substantial",
    "n. 本质；重要材料\nadj. 大量的；实质的；内容充实的",
    "adj. 大量的；价值巨大的；重大的；实质的；内容充实的"
  ],
  [
    "initial",
    "n. 词首大写字母\nadj. 最初的；字首的\nvt. 用姓名的首字母签名",
    "adj. 最初的；开始的；字首的"
  ],
  [
    "solid",
    "n. 固体；立方体\nadj. 固体的；可靠的；立体的；结实的；一致的",
    "adj. 可靠的；固体的；坚实的；立体的；结实的；一致的"
  ],
  [
    "cast",
    "n. 投掷，抛；铸件，[古生] 铸型；演员阵容；脱落物\nvt. 投，抛；计算；浇铸；投射（光、影、视线等）\nvi. 投，抛垂钓鱼钩；计算，把几个数字加起来",
    "vt. 投射；投掷；投；抛；计算；浇铸"
  ],
  [
    "plasma",
    "n. [等离子] 等离子体；血浆；[矿物] 深绿玉髓",
    "n. 血浆；[等离子] 等离子体；[矿物] 深绿玉髓"
  ],
  [
    "in charge of",
    "na. 受托…的",
    "主管；掌管；受托管理"
  ],
  [
    "trace",
    "n. 痕迹，踪迹；微量；[仪] 迹线；缰绳\nvt. 追踪，查探；描绘；回溯\nvi. 追溯；沿路走",
    "vt. 追溯；追踪；查探；描绘；回溯"
  ],
  [
    "come down",
    "na. 败落；退步；(飞机的)下降",
    "患（病）；染上（小病）（常用 come down with）"
  ],
  [
    "abstract",
    "n. 摘要；抽象；抽象的概念\nadj. 抽象的；深奥的\nvt. 摘要；提取；使……抽象化；转移(注意力、兴趣等)；使心不在焉\nvi. 做摘要；写梗概",
    "adj. 抽象的；深奥的"
  ],
  [
    "steady",
    "n. 关系固定的情侣；固定支架\nadj. 稳定的；不变的；沉着的\nvt. 使稳定；稳固；使坚定\nadv. 稳定地；稳固地\nvi. 稳固",
    "adj. 稳定的；平稳的；不变的；沉着的"
  ],
  [
    "fault",
    "n. 故障；[地质] 断层；错误；缺点；毛病；（网球等）发球失误\nvt. （通常用于疑问句或否定句）挑剔\nvi. 弄错；产生断层",
    "n. 弱点；过错；错误；缺点；毛病；故障；[地质] 断层；（网球等）发球失误"
  ],
  [
    "suspect",
    "n. 嫌疑犯\nadj. 可疑的；不可信的\nvi. 怀疑；猜想\nvt. 怀疑；猜想",
    "vt. & vi. 怀疑；猜想"
  ]
] as const;
const book='pep2019-optional-2',unit=book+':unit1',now=new Date('2026-10-29T01:00:00Z');
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
