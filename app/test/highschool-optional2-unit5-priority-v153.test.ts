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
    "swell",
    "n. 肿胀；隆起\nvt. 使膨胀；使隆起\nadj. 漂亮的；一流的\nvi. 膨胀；肿胀；隆起",
    "vi. 膨胀；肿胀；隆起"
  ],
  [
    "ease",
    "n. 轻松，舒适；安逸，悠闲\nvt. 减轻，缓和；使安心\nvi. 减轻，缓和；放松；灵活地移动",
    "vi. & vt. （使）宽慰；减轻；缓解"
  ],
  [
    "swallow",
    "n. 燕子；一次吞咽的量\nvt. 忍受；吞没\nvi. 吞下；咽下",
    "vt. & vi. 吞下；咽下"
  ],
  [
    "wrap",
    "n. 外套；围巾\nvt. 包；缠绕；隐藏；掩护\nvi. 包起来；缠绕；穿外衣",
    "vt. 包；裹；（用手臂等）围住；缠绕；隐藏；掩护"
  ],
  [
    "slip",
    "n. 滑，滑倒；片，纸片；错误；下跌；事故\nabbr. 串行线路接口协议，是旧式的协议（Serial Line Interface Protocol）\nadj. 滑动的；有活结的；活络的\nvt. 使滑动；滑过；摆脱；塞入；闪开\nvi. 滑动；滑倒；犯错；失足；减退",
    "vi. 滑倒；滑落；溜走；滑动；犯错；失足；减退"
  ],
  [
    "delay",
    "n. 延期；耽搁；被耽搁或推迟的时间\nvt. 延期；耽搁\nvi. 延期；耽搁",
    "vi. & vt. 推迟；延期；耽误；耽搁"
  ],
  [
    "sprain",
    "n. 扭伤\nvt. 扭伤",
    "vt. 扭伤（关节）"
  ],
  [
    "panic",
    "n. 恐慌，惊慌；大恐慌\nadj. 恐慌的；没有理由的\nvt. 使恐慌\nvi. 十分惊慌",
    "vi. & vt. （使）惊慌"
  ],
  [
    "interrupt",
    "n. 中断\nvt. 中断；打断；插嘴；妨碍\nvi. 打断；打扰",
    "vi. & vt. 打断；打扰；使中断"
  ],
  [
    "scream",
    "n. 尖叫声；尖锐刺耳的声音；极其滑稽可笑的人\nvi. 尖叫；呼啸；发出尖锐刺耳的声音；令人触目惊心\nvt. 尖声喊叫；大叫大嚷着要求",
    "vi. & vt. 高声喊；大声叫；尖叫"
  ],
  [
    "fellow",
    "n. 家伙；朋友；同事；会员\nadj. 同伴的，同事的；同道的\nvt. 使…与另一个对等；使…与另一个匹敌",
    "adj. 同类的；同事的；同伴的；同道的"
  ],
  [
    "choke",
    "n. 窒息；噎；[动力] 阻气门\nvi. 窒息；阻塞；说不出话来\nvt. 呛；使窒息；阻塞；抑制；扑灭",
    "vi. & vt. （使）窒息；（使）哽咽；阻塞"
  ],
  [
    "justify",
    "vi. 证明合法；整理版面\nvt. 证明…是正当的；替…辩护",
    "vt. 证明……有道理；为……辩护"
  ],
  [
    "collapse",
    "n. 倒塌；失败；衰竭\nvt. 使倒塌，使崩溃；使萎陷；折叠\nvi. 倒塌；瓦解；暴跌",
    "vi. （突然）倒塌；昏倒；瓦解；暴跌"
  ],
  [
    "manual",
    "adj. 手工的；体力的\nn. 手册，指南",
    "n. 使用手册；说明书；手册；指南"
  ],
  [
    "grab",
    "n. 攫取；霸占；夺取之物\nvt. 攫取；霸占；将…深深吸引\nvi. 攫取；夺取",
    "vt. 抓住；攫取；霸占；将……深深吸引"
  ],
  [
    "minor",
    "adj. 未成年的；次要的；较小的；小调的；二流的\nn. 未成年人；小调；副修科目\nvi. 副修",
    "adj. 较小的；次要的；轻微的；未成年的；小调的；二流的"
  ]
] as const;
const book='pep2019-optional-2',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
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
