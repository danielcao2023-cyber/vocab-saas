import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';

const cases=[
 {key:'formal',old:'n. 正式的社交活动；夜礼服\nadj. 正式的；拘谨的；有条理的',first:'adj. 正式的；拘谨的；有条理的'},
 {key:'annoyed',old:'v. 使烦恼；打扰（annoy的过去分词）\nadj. 恼怒的；烦闷的',first:'adj. 恼怒的；烦闷的'},
 {key:'annoy',old:'n. 烦恼（等于annoyance）\nvt. 骚扰；惹恼；打搅\nvi. 惹恼；令人讨厌；打搅',first:'vt. 惹恼；打搅；骚扰'},
 {key:'frightened',old:'v. 害怕；使吃惊；吓走（frighten的过去分词）\nadj. 害怕的；受惊的；受恐吓的',first:'adj. 害怕的；受惊的；受恐吓的'},
 {key:'impress',old:'n. 印象，印记；特征，痕迹\nvi. 给人印象\nvt. 盖印；强征；传送；给予某人深刻印象',first:'vt. 给予某人深刻印象；盖印；强征；传送'},
 {key:'concentrate',old:'n. 浓缩，精选；浓缩液\nvi. 集中；浓缩；全神贯注；聚集\nvt. 集中；浓缩',first:'vi. 集中；浓缩；全神贯注；聚集'},
 {key:'revise',old:'n. 修订；校订\nvi. 修订；校订；复习功课\nvt. 修正；复习；校订',first:'vi. 修订；校订；复习功课'},
] as const;

it('upgrades seven imported entries to the textbook first sense while retaining IDs and memberships',()=>{
 const db=openDb(':memory:');try{
  const entries=cases.map(c=>catalog.entries.find(e=>e.key===c.key)!);
  for(const [i,c] of cases.entries()){
   expect(entries[i].meaning.split('\n')[0]).toBe(c.first);
   expect(entries[i]).toMatchObject({meaningCorrection:{expected:c.old}});
  }
  expect(catalog.version).toBeGreaterThanOrEqual(140);
  installVocabulary(db,{...catalog,version:139,entries:entries.map((e,i)=>({...e,meaning:cases[i].old,meaningCorrection:undefined}))});
  const ids=db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all();
  const members=db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id').all();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all()).toEqual(ids);
  expect(db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id').all()).toEqual(members);
  for(const [i,c] of cases.entries())expect(db.prepare('SELECT meaning_zh FROM words WHERE headword=?').get(c.key)).toEqual({meaning_zh:entries[i].meaning});
 }finally{db.close();}
});

it.each(cases)('preserves manual and nonmatching imported $key meanings',c=>{
 for(const [meaning,source] of [['自定义释义','manual'],['其他导入释义','词库导入']] as const){
  const db=openDb(':memory:');try{
   const e=catalog.entries.find(e=>e.key===c.key)!;
   installVocabulary(db,{...catalog,version:139,entries:[{...e,meaning:c.old,meaningCorrection:undefined}]});
   db.prepare('UPDATE words SET meaning_zh=?,meaning_source=? WHERE headword=?').run(meaning,source,c.key);
   installVocabulary(db,{...catalog,entries:[e]});
   expect(db.prepare('SELECT meaning_zh,meaning_source FROM words WHERE headword=?').get(c.key)).toEqual({meaning_zh:meaning,meaning_source:source});
  }finally{db.close();}
 }
});
