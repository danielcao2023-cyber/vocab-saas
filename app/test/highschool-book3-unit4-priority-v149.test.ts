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
 ["determined","v. 决定；断定（determine的过去分词）\nadj. 决定了的；坚决的","adj. 有决心的；意志坚定的；决定了的；坚决的"],
 ["independent","n. 独立自主者；无党派者\nadj. 独立的；单独的；无党派的；不受约束的","adj. 独立的；单独的；无党派的；不受约束的"],
 ["float","n. 彩车，花车；漂流物；浮舟；浮萍\nvi. 浮动；飘动，散播；摇摆；付诸实施\nvt. 使漂浮；实行","vi. 浮动；漂流；飘动，散播；摇摆；付诸实施"],
 ["solar","n. 日光浴室\nadj. 太阳的；日光的；利用太阳光的；与太阳相关的","adj. 太阳的；太阳能的；日光的；利用太阳光的；与太阳相关的"],
 ["current","n. （水，气，电）流；趋势；涌流\nadj. 现在的；流通的，通用的；最近的；草写的","adj. 当前的；现在的；流通的，通用的；最近的；草写的"],
 ["shallow","n. [地理] 浅滩\nadj. 浅的；肤浅的\nvt. 使变浅\nvi. 变浅","adj. 肤浅的；浅的"],
 ["regular","n. 常客；正式队员；中坚分子\nadj. 定期的；有规律的；合格的；整齐的；普通的\nadv. 定期地；经常地","adj. 定期的；经常的；正常的；有规律的；合格的；整齐的；普通的"],
 ["closing","n. 结尾辞\nv. 关闭（close的ing形式）\nadj. 收盘的；结束的；结尾的","adj. 结束的；结尾的；收盘的"],
 ["Mars","n. 战神；[天] 火星","n. [天] 火星；战神"],
 ["attach","vi. 附加；附属；伴随\nvt. 使依附；贴上；系上；使依恋","vt. 系上；绑上；贴上；使依附；使依恋"],
 ["argument","n. 论证；论据；争吵；内容提要","n. 争论；争吵；论点；论证；论据；内容提要"],
] as const;
const book='pep2019-compulsory-3',unit=book+':unit4',now=new Date('2026-10-29T01:00:00Z');
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
