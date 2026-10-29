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
    "secondary",
    "n. 副手；代理人\nadj. 第二的；中等的；次要的；中级的",
    "adj. 中学的；次要的；第二的；中等的；中级的"
  ],
  [
    "chorus",
    "n. 合唱队；齐声；歌舞队\nvt. 合唱；异口同声地说\nvi. 合唱；异口同声地说话",
    "n. 合唱曲；合唱团；合唱队；齐声；歌舞队"
  ],
  [
    "tablet",
    "n. 碑；药片；写字板；小块；平板电脑\nvt. 用碑牌纪念；将(备忘录等)写在板上；将…制成小片或小块",
    "n. 平板电脑；便笺本；药片；碑；写字板；小块"
  ],
  [
    "rubber",
    "n. 橡胶；橡皮；合成橡胶；按摩师\nadj. 橡胶制成的\nvt. 涂橡胶于；用橡胶制造\nvi. 扭转脖子看；好奇地引颈而望",
    "n. 橡皮；黑板擦；橡胶；合成橡胶；按摩师"
  ],
  [
    "rigid",
    "adj. 严格的；僵硬的，死板的；坚硬的；精确的",
    "adj. 死板的；固执的；严格的；僵硬的；坚硬的；精确的"
  ],
  [
    "bubble",
    "n. 气泡，泡沫，泡状物；透明圆形罩，圆形顶\nvt. 使冒泡；滔滔不绝地说\nvi. 沸腾，冒泡；发出气泡声",
    "vi. 起泡；沸腾；冒泡；发出气泡声"
  ],
  [
    "chemist",
    "n. 化学家；化学工作者；药剂师；炼金术士",
    "n. 化学家；药剂师；药房；化学工作者；炼金术士"
  ],
  [
    "shade",
    "n. 树荫；阴影；阴凉处；遮阳物；（照片等的）明暗度；少量、些微；细微的差别\nvt. 使阴暗；使渐变；为…遮阳；使阴郁；掩盖\nvi. （颜色、色彩等）渐变",
    "vt. 给……遮挡光线；加灯罩；把……涂暗；使阴暗；使渐变；为……遮阳；使阴郁；掩盖"
  ],
  [
    "wrinkle",
    "n. 皱纹\nvi. 起皱\nvt. 使起皱纹",
    "vt. & vi. （使脸上）起皱纹；皱起"
  ],
  [
    "leftover",
    "n. 残留物；吃剩的饭菜；剩余物\nadj. 残余的；吃剩的",
    "adj. 吃剩的；残留的；残余的"
  ],
  [
    "drag",
    "n. 拖；拖累\nvi. 拖曳；缓慢而吃力地行进\nvt. 拖累；拖拉；缓慢而吃力地行进",
    "vt. 拖；拽；拖累；拖拉"
  ],
  [
    "plug",
    "n. 插头；塞子；栓\nvt. 插入；塞住；接插头\nvi. 塞住；用插头将与电源接通",
    "vt. 封堵；补足缺口；插入；塞住；接插头"
  ],
  [
    "resign",
    "n. 辞去职务\nvi. 辞职\nvt. 辞职；放弃；委托；使听从",
    "vi. & vt. 辞职；辞去"
  ],
  [
    "input",
    "n. 投入；输入电路\nvt. [自][电子] 输入；将…输入电脑",
    "n. 情况；信息；投入；输入；输入电路"
  ],
  [
    "grant",
    "n. 拨款；[法] 授予物\nvt. 授予；允许；承认\nvi. 同意",
    "vt. 同意；准许；授予；允许；承认"
  ],
  [
    "cardiac",
    "n. 强心剂；强胃剂\nadj. 心脏的；心脏病的；贲门的",
    "adj. 心脏病的；心脏的；贲门的"
  ],
  [
    "circuit",
    "n. [电子] 电路，回路；巡回；一圈；环道\nvt. 绕回…环行\nvi. 环行",
    "n. 巡回；环形线路；[电子] 电路；回路；一圈；环道"
  ],
  [
    "relay",
    "n. [电] 继电器；接替，接替人员；驿马\nvt. 转播；使接替；分程传递\nvi. 转播；接替",
    "vt. 转发；转播；使接替；分程传递"
  ],
  [
    "pray",
    "vi. 祈祷；请；恳求\nvt. 祈祷；恳求；央求",
    "vi. & vt. 企盼；祈祷；恳求"
  ]
] as const;
const book='pep2019-optional-4',unit=book+':unit4',now=new Date('2026-10-29T01:00:00Z');
function subset(key:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?157:156,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}

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
