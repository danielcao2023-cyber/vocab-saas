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
 ["fortune","n. 财富；命运；运气\nvt. 给予财富\nvi. 偶然发生","n. 机会；运气；财富；命运"],
 ["ethnic","adj. 种族的；人种的","adj. 民族特色的；异国风味的；民族的；种族的；人种的"],
 ["downtown","n. 市中心区；三分线以外\nadj. 市中心的\nadv. 往闹市区；在市区","adv. 在市中心；往市中心"],
 ["seek one's fortune","na. 找出路","寻找成功致富之路；闯世界；找出路"],
 ["select","n. 被挑选者；精萃\nadj. 精选的；挑选出来的；极好的\nvt. 挑选；选拔\nvi. 挑选","vt. 挑选；选拔"],
 ["bar","n. 条，棒；酒吧；障碍；法庭\nprep. 除……外\nvt. 禁止；阻拦","n. 酒吧；小吃店；条，棒；障碍；法庭"],
 ["claim","n. 要求；声称；索赔；断言；值得\nvt. 要求；声称；需要；认领\nvi. 提出要求","vt. 夺去（生命）；要求；声称；需要；认领"],
 ["escape","n. 逃跑；逃亡；逃走；逃跑工具或方法；野生种；泄漏\nvi. 逃脱；避开；溜走；（气体，液体等）漏出；（未受伤或只受了一点伤害而）逃脱；声音（不自觉地）由…发出\nvt. 逃避，避开，避免；被忘掉；被忽视","vi. 逃脱；避开；溜走；（气体，液体等）漏出；（未受伤或只受了一点伤害而）逃脱；声音（不自觉地）由…发出"],
 ["Atlantic","n. 大西洋\nadj. 大西洋的","adj. 大西洋的"],
 ["fold","n. 折痕；信徒；羊栏\nvt. 折叠；合拢；抱住；笼罩\nvi. 折叠起来；彻底失败","vt. 包；裹；折叠；合拢；抱住；笼罩"],
 ["super","n. 特级品，特大号；临时雇员\nadj. 特级的；极好的","adv. 特别；格外"],
 ["collection","n. 采集，聚集；[税收] 征收；收藏品；募捐","n. 作品集；收集物；收藏品；采集，聚集；[税收] 征收；募捐"],
 ["mild","adj. 温和的；轻微的；淡味的；文雅的；不含有害物质的的\nn. （英国的一种）淡味麦芽啤酒","adj. 温和的；轻微的；淡味的；文雅的；不含有害物质的"],
 ["settle","n. 有背长椅\nvi. 解决；定居；沉淀；下陷\nvt. 解决；安排；使…定居","vi. 定居；沉淀；下陷"],
 ["construction","n. 建设；建筑物；解释；造句","n. 建造；建筑；建筑物；结构；解释；造句"],
 ["to name but a few","adj. 略举数例","仅举几例；略举数例"],
 ["herbal","n. 植物志；草本书\nadj. 草药的；草本的","adj. 草药的；草本的"],
 ["at first hand","na. 直接","第一手；亲自；直接"],
 ["neat","adj. 灵巧的；整洁的；优雅的；齐整的；未搀水的；平滑的","adj. 极好的；灵巧的；整洁的；优雅的；齐整的；未搀水的；平滑的"],
] as const;
const book='pep2019-compulsory-3',unit=book+':unit3',now=new Date('2026-10-29T01:00:00Z');
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
