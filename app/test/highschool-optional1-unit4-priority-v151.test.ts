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
    "interaction",
    "n. 相互作用；[数] 交互作用\nn. 互动",
    "n. 交流；相互影响；相互作用；互动；[数] 交互作用"
  ],
  [
    "approve",
    "vi. 批准；赞成；满意\nvt. 批准；赞成；为…提供证据",
    "vi. 赞成；同意；满意"
  ],
  [
    "demonstrate",
    "vt. 证明；展示；论证\nvi. 示威",
    "vt. 表现；表达；说明；证明；展示；论证"
  ],
  [
    "witness",
    "n. 证人；目击者；证据\nvt. 目击；证明；为…作证\nvi. 作证人",
    "vt. 目击；见证；证明；为……作证"
  ],
  [
    "employ",
    "n. 使用；雇用\nvt. 使用，采用；雇用；使忙于，使从事于",
    "vt. 使用；应用；采用；雇用；使忙于；使从事于"
  ],
  [
    "identical",
    "n. 完全相同的事物\nadj. 同一的；完全相同的",
    "adj. 相同的；同一的；完全相同的"
  ],
  [
    "interpret",
    "vi. 解释；翻译\nvt. 说明；口译",
    "vt. 把……理解为；说明；口译"
  ],
  [
    "favour",
    "n. 偏爱；赞同；善行\nvt. 赞成；喜爱；有助于",
    "vt. 较喜欢；选择；有利于；赞成；喜爱；有助于"
  ],
  [
    "break down",
    "v. 分解；抛锚；分析；划分",
    "v. 消除；打破；分解；抛锚；分析；划分"
  ],
  [
    "fake",
    "n. 假货；骗子；假动作\nadj. 伪造的\nvt. 捏造；假装…的样子\nvi. 假装；做假动作",
    "adj. 假的；冒充的；伪造的"
  ],
  [
    "reliable",
    "n. 可靠的人\nadj. 可靠的；可信赖的",
    "adj. 可靠的；可信赖的"
  ],
  [
    "slight",
    "n. 怠慢；轻蔑\nadj. 轻微的，少量的；脆弱的；细长的；不重要的\nvt. 轻视，忽略；怠慢",
    "adj. 轻微的；少量的；脆弱的；细长的；不重要的"
  ],
  [
    "internal",
    "n. 内脏；本质\nadj. 内部的；里面的；体内的；（机构）内部的",
    "adj. 内部的；里面的；体内的；（机构）内部的"
  ],
  [
    "slump",
    "vt. 使降低；使衰落；使倒下\nn. 衰退；暴跌；消沉\nvi. 下降，衰落；倒下；大幅度下降，暴跌",
    "vi. 垂头弯腰地走（或坐）；下降；衰落；倒下；暴跌"
  ],
  [
    "pose",
    "vi. 摆姿势；佯装；矫揉造作\nvt. 造成，形成；摆姿势；装模作样；提出…讨论\nn. 姿势，姿态；装模作样",
    "n. 姿势；姿态；装模作样"
  ],
  [
    "bend",
    "n. 弯曲\nvt. 使弯曲；使屈服；使致力；使朝向\nvi. 弯曲，转弯；屈服；倾向；专心于",
    "vt. & vi. （使）弯曲；倾斜"
  ],
  [
    "reveal",
    "n. 揭露；暴露；门侧，窗侧\nvt. 显示；透露；揭露；泄露",
    "vt. 揭示；显示；露出；透露；揭露；泄露"
  ],
  [
    "tick",
    "n. 滴答声；扁虱；记号；赊欠\nvt. 标记号于；滴答地记录\nvi. 发出滴答声；标以记号",
    "vt. 给……打钩；标记号于；滴答地记录"
  ],
  [
    "barely",
    "adv. 仅仅，勉强；几乎不；公开地；贫乏地",
    "adv. 几乎不；勉强才能；刚刚；仅仅；勉强；公开地（古）；贫乏地"
  ],
  [
    "stare",
    "n. 凝视；注视\nvt. 凝视，盯着看\nvi. 凝视，盯着看；显眼",
    "vi. 盯着看；凝视；显眼"
  ],
  [
    "embarrassed",
    "v. 使...困窘；使...局促不安（embarrass的过去分词形式）\nadj. 尴尬的；窘迫的",
    "adj. 尴尬的；难堪的；窘迫的"
  ],
  [
    "bother",
    "n. 麻烦；烦恼\nvt. 烦扰，打扰；使……不安；使……恼怒\nvi. 操心，麻烦；烦恼",
    "vi. & vt. 费心；麻烦；操心"
  ],
  [
    "weep",
    "n. 哭泣；眼泪；滴下\nvt. 哭泣；流泪；悲叹；流出或渗出液体\nvi. 哭泣；流泪；哀悼；滴落；渗出液体",
    "vi. & vt. 哭泣；流泪"
  ]
] as const;
const book='pep2019-optional-1',unit=book+':unit4',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?151:150,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
