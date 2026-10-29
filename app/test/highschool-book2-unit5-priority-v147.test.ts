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
 ["classical","n. 古典音乐\nadj. 古典的；经典的；传统的；第一流的","adj. 古典的；经典的；传统的；第一流的"],
 ["conductor","n. 导体；售票员；领导者；管理人","n. 指挥；售票员；导体；领导者；管理人"],
 ["original","n. 原件；原作；原物；原型\nadj. 原始的；最初的；独创的；新颖的","adj. 原来的；原作的；原始的；最初的；独创的；新颖的"],
 ["altogether","n. 整个；裸体\nadv. 完全地；总共；总而言之","adv. 全部；总共；完全地；总而言之"],
 ["rap","n. 轻敲\nvi. 敲击；交谈\nvt. 抢走；轻敲；敲击致使；使着迷","n. 快速敲击；说唱音乐；轻敲"],
 ["gradual","n. 弥撒升阶圣歌集\nadj. 逐渐的；平缓的","adj. 逐渐的；渐进的；平缓的"],
 ["romantic","n. 浪漫的人\nadj. 浪漫的；多情的；空想的\nvt. 使…浪漫化","adj. 浪漫的；多情的；空想的"],
 ["impact","vi. 影响；撞击；冲突；压紧（on，upon，with）\nn. 影响；效果；碰撞；冲击力\nvt. 挤入，压紧；撞击；对…产生影响","n. 巨大影响；强大作用；影响；效果；碰撞；冲击力"],
 ["set sth. up","na. 建立；创立；发起；开办","安装好（设备或机器）；建立；创立；发起；开办"],
 ["try out","na. (采用前)严密试验；筛矿；量(金属的)纯度","参加选拔或试演；试用；试验"],
 ["assume","vt. 僭取；篡夺；夺取；擅用；侵占\nvi. 假定；设想；承担；采取","vt. 以为；假设；假定；设想；承担；采取；僭取；篡夺；夺取；擅用；侵占"],
 ["get through","na. 花光；了结；(使)通过(议案)；及格","设法处理；完成；通过；花光；了结；及格"],
 ["Eric Whitacre","无","埃里克·惠塔克（作曲家）"],
 ["Lux Aurumque","无","《金色光芒》（歌曲名）"],
 ["John A. Logan","无","约翰·洛根（人名）"],
] as const;
const book='pep2019-compulsory-2',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?147:146,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
