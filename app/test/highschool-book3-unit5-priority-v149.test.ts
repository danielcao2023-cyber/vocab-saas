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
    "ignore",
    "vt. 驳回诉讼；忽视；不理睬",
    "vt. 忽视；对……不予理会"
  ],
  [
    "scene",
    "n. 场面；情景；景象；事件",
    "n. 场面；情景；现场；（戏剧或歌剧中的）场"
  ],
  [
    "sail",
    "n. 帆，篷；航行\nvi. 航行；启航，开船\nvt. 航行",
    "vi. & vt. 航行；乘船航行"
  ],
  [
    "spot",
    "n. 地点；斑点\nadj. 现场的；现货买卖的\nvt. 认出；弄脏；用灯光照射\nvi. 沾上污渍；满是斑点\nadv. 准确地；恰好",
    "vt. 看见；注意到；发现"
  ],
  [
    "dare",
    "n. 挑战；挑动\nvt. 敢冒；不惧\nvi. 敢；胆敢",
    "vi. & modal v. 敢；胆敢"
  ],
  [
    "odd",
    "adj. 奇数的；古怪的；剩余的；临时的；零散的\nn. 奇数；怪人；奇特的事物",
    "adj. 奇怪的；怪异的；反常的"
  ],
  [
    "musical",
    "adj. 音乐的；悦耳的\nn. 音乐片",
    "n. 音乐剧"
  ],
  [
    "pursue",
    "vi. 追赶；继续进行\nvt. 继续；从事；追赶；纠缠",
    "vt. 追求；致力于"
  ],
  [
    "hesitate",
    "vt. 踌躇，犹豫；有疑虑，不愿意\nvi. 踌躇，犹豫；不愿",
    "vi. 犹豫；迟疑；顾虑；不愿"
  ],
  [
    "downstairs",
    "n. 楼下\nadj. 楼下的\nadv. 在楼下",
    "adv. 顺楼梯而下；在楼下；往楼下"
  ],
  [
    "aside",
    "prep. 在…旁边\nn. 旁白；私语，悄悄话；离题的话\nadv. 离开，撇开；在旁边",
    "adv. 到旁边；在旁边；留；存"
  ],
  [
    "broad",
    "n. 宽阔部分\nadj. 宽的，辽阔的；显著的；大概的\nadv. 宽阔地",
    "adj. 宽阔的；广阔的；广泛的"
  ],
  [
    "upper-class",
    "n. 上层社会\nadj. 上流社会的；上层阶级的；中学三年级，四年级的",
    "adj. 上流社会的；上等阶层的"
  ],
  [
    "permit",
    "n. 许可证，执照\nvt. 许可；允许\nvi. 许可；允许",
    "vt. & vi. 允许；准许；使有可能"
  ],
  [
    "external",
    "n. 外部；外观；外面\nadj. 外部的；表面的；[药] 外用的；外国的；外面的",
    "adj. 外部的；外面的；外来的"
  ]
] as const;
const book='pep2019-compulsory-3',unit=book+':unit5',now=new Date('2026-10-29T01:00:00Z');
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
