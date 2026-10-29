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
 ["faint","n. [中医] 昏厥，昏倒\nadj. 模糊的；头晕的；虚弱的；[医] 衰弱的\nvi. 昏倒；变得微弱；变得没气力","vi. 昏倒；晕厥"],
 ["illustrate","vi. 举例\nvt. 阐明，举例说明；图解","vt. 举例说明；阐明；加插图"],
 ["tuition","n. 学费；讲授","n. 教学；讲课；学费"],
 ["respond","n. 应答；唱和\nvi. 回答；作出反应；承担责任\nvt. 以…回答","vi. 回答；回复；回应；作出反应（常接 to）"],
 ["hire","n. 雇用，租用；租金，工钱\nvt. 雇用；出租\nvi. 雇用，租用；受雇","vt. 聘任；雇用；租用"],
 ["reject","n. 被弃之物或人；次品\nvt. 拒绝；排斥；抵制；丢弃","vt. 拒绝接受；不录用"],
 ["elect","n. 被选的人；特殊阶层；上帝的选民\nadj. 选出的；当选的；卓越的\nvi. 作出选择；进行选举\nvt. 选举；选择；推选","vt. 选举；推选"],
 ["retire","n. 退休；退隐；退兵信号\nvi. 退休；撤退；退却\nvt. 退休；离开；收回","vi. & vt. 退休；退职；退出"],
 ["passive","n. 被动语态\nadj. 被动的，消极的；被动语态的","adj. 被动的；顺从的"],
 ["scared","v. 使害怕（scare的过去分词）\nadj. 害怕的","adj. 害怕的；惊恐的"],
 ["sharp","n. 尖头；骗子；内行\nadj. 急剧的；锋利的；强烈的；敏捷的；刺耳的\nvt. 磨快；把音调升高\nadv. 急剧地；锐利地；突然地\nvi. 打扮；升音演奏","adj. 急剧的；锋利的；明显的"],
 ["whisper","n. 私语；谣传；飒飒的声音\nvi. 耳语；密谈；飒飒地响\nvt. 低声说出","vi. & vt. 悄声说；耳语"],
 ["bite","n. 咬；一口；咬伤；刺痛\nabbr. 机内测试设备（Built-In Test Equipment）\nvt. 咬；刺痛\nvi. 咬；刺痛","vt. & vi. 咬；叮；蛰"],
 ["assist","n. 帮助；助攻\nvi. 参加；出席\nvt. 帮助；促进","vt. 帮助；援助"],
 ["disguise","n. 伪装；假装；用作伪装的东西\nvt. 掩饰；假装；隐瞒","vt. 装扮；假扮；掩盖"],
 ["spill","n. 溢出，溅出；溢出量；摔下；小塞子\nvi. 溢出，流出；摔下；涌流\nvt. 使溢出，使流出；使摔下","vt. & vi. （使）洒出；（使）溢出"],
 ["limp","adj. 柔软的，无力的；软弱的\nvi. 跛行，一拐一拐地走；缓慢费力地前进\nn. 跛行","vi. 跛行；一瘸一拐地走"],
 ["operation","n. 操作；经营；[外科] 手术；[数][计] 运算","n. 手术；企业；经营"],
] as const;
const book='pep2019-compulsory-3',unit=book+':unit2',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?148:147,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
