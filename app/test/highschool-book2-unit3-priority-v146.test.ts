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
 ["stream","n. 溪流；流动；潮流；光线\nvt. 流出；涌出；使飘动\nvi. 流；涌进；飘扬","vt. 流播；流出；涌出；使飘动"],
 ["stuck","v. 刺（stick的过去式）\nadj. 被卡住的；不能动的","adj. 卡住的；陷入困境的；不能动的"],
 ["surf","vi. 作冲浪运动\nvt. 在…冲浪\nn. 海浪，拍岸浪","vt. & vi. 浏览；冲浪"],
 ["go through","na. 认真检查；仔细地搜；(提案或法案)通过；被批准","经历；度过；通读；仔细检查"],
 ["tough","n. 恶棍\nadj. 艰苦的，困难的；坚强的，不屈不挠的；坚韧的，牢固的；强壮的，结实的\nvt. 坚持；忍受，忍耐\nadv. 强硬地，顽强地","adj. 艰难的；严厉的；困难的；坚强的；不屈不挠的；坚韧的；牢固的；强壮的；结实的"],
 ["plus","prep. 加，加上\nn. 正号，加号；好处；附加额\nadj. 正的；附加的","conj. 而且；此外"],
 ["particular","n. 详细说明；个别项目\nadj. 特别的；详细的；独有的；挑剔的","adj. 特定的；特别的；讲究的；详细的；独有的；挑剔的"],
 ["upset","n. 混乱；翻倒；颠覆\nadj. 心烦的；混乱的；弄翻的\nvt. 使心烦；颠覆；扰乱\nvi. 翻倒","adj. 心烦的；苦恼的；沮丧的；混乱的；弄翻的"],
 ["tip","n. 小费；尖端；小建议，小窍门；轻拍\nvt. 给小费；倾斜；翻倒；装顶端\nvi. 给小费；翻倒；倾覆","n. 忠告；诀窍；实用提示；小费；尖端；小建议；小窍门；轻拍"],
] as const;
const book='pep2019-compulsory-2',unit=book+':unit3',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?146:145,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
