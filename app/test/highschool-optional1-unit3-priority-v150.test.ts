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
    "vast",
    "n. 浩瀚；广阔无垠的空间\nadj. 广阔的；巨大的；大量的；巨额的",
    "adj. 辽阔的；巨大的；庞大的；广阔的；大量的；巨额的"
  ],
  [
    "visible",
    "n. 可见物；进出口贸易中的有形项目\nadj. 明显的；看得见的；现有的；可得到的",
    "adj. 看得见的；可见的；明显的；现有的；可得到的"
  ],
  [
    "ban",
    "n. 禁令，禁忌\nvt. 禁止，取缔",
    "vt. 明令禁止；取缔"
  ],
  [
    "adopt",
    "vi. 采取；过继\nvt. 采取；接受；收养；正式通过",
    "vt. 采用；采取；采纳；接受；收养；正式通过"
  ],
  [
    "sour",
    "n. 酸味；苦事\nadj. 酸的；发酵的；刺耳的；酸臭的；讨厌的\nvt. 使变酸；使失望\nvi. 发酵；变酸；厌烦",
    "adj. 酸的；有酸味的；发酵的；刺耳的；酸臭的；讨厌的"
  ],
  [
    "sneeze",
    "n. 喷嚏\nvi. 打喷嚏",
    "vi. 打喷嚏"
  ],
  [
    "stretch",
    "vt. 伸展,张开；（大量地）使用，消耗（金钱，时间）；使竭尽所能；使全力以赴；\nn. 伸展，延伸\nvi. 伸展；足够买（或支付）",
    "vi. 延伸；延续；伸展；足够买（或支付）"
  ],
  [
    "cycle",
    "n. 循环；周期；自行车；整套；一段时间\nvt. 使循环；使轮转\nvi. 循环；骑自行车；轮转",
    "n. 自行车；摩托车；循环；周期；整套；一段时间"
  ],
  [
    "corridor",
    "走廊",
    "n. 狭长地带；走廊；过道；通道"
  ],
  [
    "theme",
    "n. 主题；主旋律；题目\nadj. 以奇想主题布置的",
    "n. 主题；主旋律；题目（可作定语，如 theme park 主题公园）"
  ],
  [
    "appeal",
    "n. 呼吁，请求；吸引力，感染力；上诉；诉诸裁判\nvt. 将…上诉，对…上诉\nvi. 呼吁，恳求；上诉；诉诸，求助；有吸引力，迎合爱好；（体育比赛中）诉诸裁判",
    "vi. 有吸引力；呼吁；恳求；上诉；诉诸；求助；迎合爱好；（体育比赛中）诉诸裁判"
  ],
  [
    "swing",
    "n. 摇摆；摆动；秋千；音律；涨落\nadj. 旋转的；悬挂的；强节奏爵士音乐的\nvt. 使旋转；挥舞；悬挂\nvi. 摇摆；转向；悬挂；大摇大摆地行走",
    "vt. & vi. （使）摆动；摇摆；转弯"
  ],
  [
    "iron",
    "n. 熨斗；烙铁；坚强\nadj. 铁的；残酷的；刚强的\nvt. 熨；用铁铸成\nvi. 熨衣；烫平",
    "n. 铁；铁器；铸铁；熨斗；烙铁；坚强"
  ],
  [
    "polar",
    "n. 极面；极线\nadj. 极地的；两极的；正好相反的",
    "adj. 极地的；南极或北极的；磁极的；两极的；正好相反的"
  ],
  [
    "display",
    "n. 显示；炫耀\nvt. 显示；表现；陈列\nadj. 展览的；陈列用的\nvi. [动] 作炫耀行为",
    "n. 展览；陈列；展览品；显示；炫耀"
  ],
  [
    "Siberian",
    "adj. 西伯利亚（人）的；来自西伯利亚的",
    "adj. 西伯利亚（人）的；来自西伯利亚的"
  ],
  [
    "cream",
    "n. 奶油，乳脂；精华；面霜；乳酪",
    "n. 奶油；乳脂；护肤霜；精华；乳酪"
  ]
] as const;
const book='pep2019-optional-1',unit=book+':unit3',now=new Date('2026-10-29T01:00:00Z');
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
  expect(db.prepare('SELECT * FROM learning_day_words').all()).toEqual(before);const replacement=nextLearning(db,now).card!;expect(replacement.wordId).toBe(card.wordId);expect(replacement.options[0].text).toBe(first);
  if (old.split('\n')[0] === first) expect(replacement.issueId).toBe(card.issueId);
  else {expect(replacement.issueId).not.toBe(card.issueId);expect(()=>answerLearning(db,{policyVersion:policy,issueId:card.issueId,answerId:'old',choiceId:card.wordId} as any,now)).toThrow(/题目已更新/);}
  const answer={policyVersion:policy,issueId:replacement.issueId,answerId:'new',choiceId:card.wordId};const result=answerLearning(db,answer as any,now);expect(result.correct).toBe(true);expect(answerLearning(db,answer as any,now)).toEqual(result);
 }finally{mobile?.close();source.close();}
});

it('keeps the reviewed distinctions for adopt, theme, cycle and the old migration values',()=>{
 const read=(key:string)=>catalog.entries.find(e=>e.key===key)!;
 expect(read('adopt').meaning).toContain('vt. 采用；采取；采纳；接受；收养');
 expect(read('adopt').meaning).not.toContain('vi. 采取');
 expect(read('theme').meaning).toContain('可作定语');
 expect(read('theme').meaning).not.toContain('adj.');
 expect(read('cycle').meaning).toContain('摩托车');
 for(const [key,old] of cases)expect(read(key)).toMatchObject({meaningCorrection:{expected:old}});
});
