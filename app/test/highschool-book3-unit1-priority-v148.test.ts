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
 ["religious","n. 修道士；尼姑\nadj. 宗教的；虔诚的；严谨的；修道的","adj. 宗教的；虔诚的；严谨的；修道的"],
 ["gather","n. 聚集；衣褶；收获量\nvt. 收集；收割；使…聚集；使…皱起\nvi. 聚集；化脓；皱起","vi. 聚集；化脓；皱起"],
 ["fade","n. [电影][电视] 淡出；[电影][电视] 淡入\nadj. 平淡的；乏味的\nvi. 褪色；凋谢；逐渐消失\nvt. 使褪色","vi. 褪色；凋谢；逐渐消失"],
 ["commercial","n. 商业广告\nadj. 商业的；营利的；靠广告收入的","adj. 商业的；营利的；靠广告收入的"],
 ["roast","n. 烤肉；烘烤\nadj. 烘烤的；烤过的\nvt. 烤，焙；烘，烘烤；暴露于某种热力下以得温暖\nvi. 烤；烘","adj. 烘烤的；烤过的"],
 ["frank","n. 免费邮寄特权\nadj. 坦白的，直率的；老实的\nvt. 免费邮寄","adj. 坦白的，直率的；老实的"],
 ["inner","n. 内部\nadj. 内部的；内心的；精神的","adj. 内部的；内心的；精神的"],
 ["wrestle","n. 摔跤；搏斗；斗争\nvi. 摔跤；斗争；斟酌\nvt. 与摔跤；与…搏斗；使劲搬动","vi. 摔跤；斗争；斟酌"],
 ["fancy","n. 幻想；想象力；爱好\nadj. 想象的；奇特的；昂贵的；精选的\nvt. 想象；喜爱；设想；自负\nvi. 幻想；想象","adj. 花哨的；精致的；昂贵的；想象的；奇特的；精选的"],
 ["brief","n. 摘要，简报；概要，诉书\nadj. 简短的，简洁的；短暂的，草率的\nvt. 简报，摘要；作…的提要","adj. 简短的，简洁的；短暂的，草率的"],
 ["go off","phr. v. 响起；爆炸；（食物）变质；（活动）进行","phr. v. 响起；爆炸；离开；（食物）变质；（活动）进行"],
] as const;
const book='pep2019-compulsory-3',unit=book+':unit1',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?148:147,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

it('preserves the historical go off correction when upgrading directly from the older catalog',()=>{
 const prior='na. 进行得 (well； badly)；(话等)冒出',entry=catalog.entries.find(e=>e.key==='go off')!;
 expect(entry.meaningCorrection).toMatchObject({expected:'phr. v. 响起；爆炸；（食物）变质；（活动）进行',previous:[prior]});
 const db=openDb(':memory:');try{
  installVocabulary(db,subset('go off',prior));const before=db.prepare("SELECT id FROM words WHERE headword='go off'").get();
  installVocabulary(db,subset('go off'));expect(db.prepare("SELECT id FROM words WHERE headword='go off'").get()).toEqual(before);
  expect(db.prepare("SELECT meaning_zh FROM words WHERE headword='go off'").get()).toEqual({meaning_zh:entry.meaning});
 }finally{db.close();}
});

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
