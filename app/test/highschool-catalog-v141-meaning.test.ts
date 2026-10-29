import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';

const cases=[
 ['teenage','n. 青少年时期\nadj. 青少年的；十几岁的','adj. 青少年的；十几岁的'],
 ['graduate','n. 研究生；毕业生\nadj. 毕业的；研究生的\nvt. 授予…学位；分等级；标上刻度\nvi. 毕业；渐变','vi. 毕业；获得学位'],
 ['former','n. 模型，样板；起形成作用的人\nadj. 从前的，前者的；前任的','adj. 从前的，前者的；前任的'],
 ['preserve','n. 保护区；禁猎地；加工成的食品\nvt. 保存；保护；维持；腌；禁猎','vt. 保存；保护；维持；腌；禁猎'],
 ['promote','vi. 成为王后或其他大于卒的子\nvt. 促进；提升；推销；发扬','vt. 促进；提升；推销；发扬'],
 ['establish','vi. 植物定植\nvt. 建立；创办；安置','vt. 建立；创办；安置'],
 ['digital','n. 数字；键\nadj. 数字的；手指的','adj. 数码的；数字显示的；手指的'],
 ['quote','n. 引用\nvi. 报价；引用；引证\nvt. 报价；引述；举证','vt. 引述；报价；举证'],
 ['image','n. 影像；想象；肖像；偶像\nvt. 想象；反映；象征；作…的像','n. 图像；形象；印象；影像；想象；肖像；偶像'],
 ['loss','n. 减少；亏损；失败；遗失','n. 丧失；损失；减少；亏损；失败；遗失'],
 ['app','abbr. 应用（Application）；穿甲试验（Armor Piercing Proof）','n. 应用程序；应用软件'],
] as const;

it('upgrades the exact eleven imported meanings while preserving shared IDs and memberships',()=>{
 const db=openDb(':memory:');try{
  const entries=cases.map(([key])=>catalog.entries.find(e=>e.key===key)!);
  for(const [i,[,old,first]] of cases.entries()){
   expect(entries[i].meaning.split('\n')[0]).toBe(first);
   expect(entries[i]).toMatchObject({meaningCorrection:{expected:old}});
  }
  expect(catalog.version).toBeGreaterThanOrEqual(141);
  installVocabulary(db,{...catalog,version:140,entries:entries.map((e,i)=>({...e,meaning:cases[i][1],meaningCorrection:undefined}))});
  const ids=db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all();
  const members=db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id,book_id').all();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all()).toEqual(ids);
  expect(db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id,book_id').all()).toEqual(members);
  for(const [i,[key]] of cases.entries())expect(db.prepare('SELECT meaning_zh FROM words WHERE headword=?').get(key)).toEqual({meaning_zh:entries[i].meaning});
 }finally{db.close();}
});

it.each(cases)('preserves $0 manual or nonmatching imported meanings', (key,old)=>{
 for(const [meaning,source] of [['自定义释义','manual'],['其他导入释义','词库导入']] as const){
  const db=openDb(':memory:');try{
   const e=catalog.entries.find(e=>e.key===key)!;
   installVocabulary(db,{...catalog,version:140,entries:[{...e,meaning:old,meaningCorrection:undefined}]});
   db.prepare('UPDATE words SET meaning_zh=?,meaning_source=? WHERE headword=?').run(meaning,source,key);
   installVocabulary(db,{...catalog,entries:[e]});
   expect(db.prepare('SELECT meaning_zh,meaning_source FROM words WHERE headword=?').get(key)).toEqual({meaning_zh:meaning,meaning_source:source});
  }finally{db.close();}
 }
});

it('reissues open recognition snapshots for these corrections and preserves answered snapshots',()=>{
 const db=openDb(':memory:');try{
  const entries=cases.map(([key])=>catalog.entries.find(e=>e.key===key)!);
  installVocabulary(db,{...catalog,version:140,entries:entries.map((e,i)=>({...e,meaning:cases[i][1],meaningCorrection:undefined}))});
  const insert=db.prepare('INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at,answered_at,answer_id,result_json) VALUES (?,?,?,?,?,?,?,?,?)');
  for(const [key,old] of cases){
   const {id}=db.prepare('SELECT id FROM words WHERE headword=?').get(key) as {id:number};
   const snapshot=JSON.stringify([{id,text:old.split('\n')[0]},{id:0,text:'不记得'}]);
   insert.run('open-'+id,'2026-10-30',id,'recognize',snapshot,'2026-10-30T01:00:00Z',null,null,null);
   insert.run('done-'+id,'2026-10-29',id,'recognize',snapshot,'2026-10-29T01:00:00Z','2026-10-29T01:01:00Z','answer-'+id,'{"correct":true}');
  }
  const completed=db.prepare("SELECT * FROM learning_issues WHERE id LIKE 'done-%' ORDER BY id").all();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare("SELECT * FROM learning_issues WHERE id LIKE 'done-%' ORDER BY id").all()).toEqual(completed);
  for(const [key,,first] of cases){
   const {id}=db.prepare('SELECT id FROM words WHERE headword=?').get(key) as {id:number};
   expect((db.prepare('SELECT answered_at FROM learning_issues WHERE id=?').get('open-'+id) as {answered_at:string|null}).answered_at).not.toBeNull();
   const pending=db.prepare('SELECT options_json FROM learning_issues WHERE word_id=? AND answered_at IS NULL').get(id) as {options_json:string};
   expect(JSON.parse(pending.options_json)).toEqual([{id,text:first},{id:0,text:'不记得'}]);
  }
 }finally{db.close();}
});
