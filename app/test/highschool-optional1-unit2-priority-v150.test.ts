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
    "critical",
    "adj. 鉴定的；[核] 临界的；批评的，爱挑剔的；危险的；决定性的；评论的",
    "adj. 严重的；关键的；批判性的；鉴定的；[核] 临界的；批评的；爱挑剔的；危险的；决定性的；评论的"
  ],
  [
    "automatic",
    "n. 自动机械；自动手枪\nadj. 自动的；无意识的；必然的",
    "adj. 自动的；无意识的；必然的"
  ],
  [
    "combine",
    "n. 联合收割机；联合企业\nvt. 使化合；使联合，使结合\nvi. 联合，结合；化合",
    "vt. & vi. （使）结合；混合；化合；联合"
  ],
  [
    "resist",
    "n. [助剂] 抗蚀剂；防染剂\nvt. 抵抗；忍耐，忍住\nvi. 抵抗，抗拒；忍耐",
    "vt. & vi. 抵制；反抗；抵挡；抵抗；抗拒；忍耐；忍住"
  ],
  [
    "cease",
    "n. 停止\nvi. 停止；终了\nvt. 停止；结束",
    "vi. & vt. （使）停止；终止；终了；结束"
  ],
  [
    "deceased",
    "n. 死者；[法] 被继承人\nadj. 已故的\nvi. 死亡（decease的过去式）",
    "adj. 已故的；亡故的"
  ],
  [
    "remote",
    "n. 远程\nadj. 遥远的；偏僻的；疏远的",
    "adj. 远程的；偏远的；遥远的；偏僻的；疏远的"
  ],
  [
    "integrate",
    "n. 一体化；集成体\nadj. 整合的；完全的\nvi. 求积分；取消隔离；成为一体\nvt. 使…完整；使…成整体；求…的积分；表示…的总和",
    "vi. & vt. （使）合并；成为一体"
  ],
  [
    "constant",
    "n. [数] 常数；恒量\nadj. 不变的；恒定的；经常的",
    "adj. 不断的；重复的；不变的；恒定的；经常的"
  ],
  [
    "advocate",
    "n. 提倡者；支持者；律师\nvt. 提倡，主张，拥护",
    "vt. 提倡；支持；拥护；主张"
  ],
  [
    "instant",
    "n. 瞬间；立即；片刻\nadj. 立即的；紧急的；紧迫的",
    "n. 瞬间；片刻"
  ],
  [
    "knob",
    "n. 把手；瘤；球形突出物\nvi. 鼓起\nvt. 使有球形突出物",
    "n. 旋钮；球形把手；瘤；球形突出物"
  ]
] as const;
const book='pep2019-optional-1',unit=book+':unit2',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?150:149,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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

it('distinguishes instant as noun from its adjective and keeps migration history',()=>{
 const entry=catalog.entries.find(e=>e.key==='instant')!;
 expect(entry.meaning.split('\n')[0]).toBe('n. 瞬间；片刻');
 expect(entry.meaning).toContain('adj. 立即的');
 for(const [key,old] of cases)expect(catalog.entries.find(e=>e.key===key)).toMatchObject({meaningCorrection:{expected:old}});
});
