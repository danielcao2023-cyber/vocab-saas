import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';

const cases=[
 {key:'set out',old:'n. 开始；出发；动身；准备',corrected:'phr. v. 出发；动身；开始做某事'},
 {key:'face down',old:'n. 〈美口〉同“face off”；摊牌\nadv. 面朝下地',corrected:'adv. 面朝下地'},
] as const;

it('upgrades the exact imported meanings without changing word IDs or memberships',()=>{
 const db=openDb(':memory:');try{
  const entries=cases.map(c=>catalog.entries.find(e=>e.key===c.key)!);
  for(const [i,c] of cases.entries())expect(entries[i]).toMatchObject({meaning:c.corrected,meaningCorrection:{expected:c.old}});
  const old={...catalog,version:138,entries:entries.map((e,i)=>({...e,meaning:cases[i].old,meaningCorrection:undefined}))};
  installVocabulary(db,old);
  const before=db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all();
  const memberships=db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id').all();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all()).toEqual(before);
  expect(db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id').all()).toEqual(memberships);
  for(const c of cases)expect(db.prepare('SELECT meaning_zh FROM words WHERE headword=?').get(c.key)).toEqual({meaning_zh:c.corrected});
 }finally{db.close();}
});

it.each(cases)('does not overwrite manual or nonmatching existing $key meaning',c=>{
 for(const [meaning,source] of [['我的释义','manual'],['其他导入释义','词库导入']] as const){
  const db=openDb(':memory:');try{
   const e=catalog.entries.find(e=>e.key===c.key)!;
   installVocabulary(db,{...catalog,version:138,entries:[{...e,meaning:c.old,meaningCorrection:undefined}]});
   db.prepare('UPDATE words SET meaning_zh=?,meaning_source=? WHERE headword=?').run(meaning,source,c.key);
   installVocabulary(db,{...catalog,entries:[e]});
   expect(db.prepare('SELECT meaning_zh,meaning_source FROM words WHERE headword=?').get(c.key)).toEqual({meaning_zh:meaning,meaning_source:source});
  }finally{db.close();}
 }
});
