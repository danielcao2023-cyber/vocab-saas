import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
import proposals from '../qa/highschool-lessons/compulsory1-unit2-first-line-proposals-2026-10-30.json';

const entries=proposals.map(p=>catalog.entries.find(e=>e.key===p.key)!);
const oldEntries=entries.map((e,i)=>({...e,meaning:proposals[i].expected,meaningCorrection:undefined}));
it('upgrades the exact previous meanings while preserving stable ids and all memberships',()=>{
 const db=openDb(':memory:');try{
  installVocabulary(db,{...catalog,version:140,entries:oldEntries});
  const maps=db.prepare('SELECT * FROM vocabulary_entry_map ORDER BY entry_key').all();
  const members=db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id,book_id,unit_id').all();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare('SELECT * FROM vocabulary_entry_map ORDER BY entry_key').all()).toEqual(maps);
  expect(db.prepare('SELECT * FROM vocabulary_members ORDER BY word_id,book_id,unit_id').all()).toEqual(members);
  for(const e of entries)expect(db.prepare('SELECT meaning_zh FROM words WHERE headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});
 }finally{db.close()}
});
it('upgrades rent from both released old values',()=>{
 const e=entries.find(e=>e.key==='rent')!;
 for(const old of [proposals.find(p=>p.key==='rent')!.expected,proposals.find(p=>p.key==='rent')!.existingMeaningCorrection!.expected]){
  const db=openDb(':memory:');try{installVocabulary(db,{...catalog,version:140,entries:[{...e,meaning:old,meaningCorrection:undefined}]});installVocabulary(db,{...catalog,entries:[e]});expect(db.prepare('SELECT meaning_zh FROM words WHERE headword=?').get('rent')).toEqual({meaning_zh:e.meaning});}finally{db.close()}
 }
});
it('does not overwrite learner edits, mismatched imports, or shared core words',()=>{
 const e=entries.find(e=>e.key==='pack')!;const old=proposals.find(p=>p.key==='pack')!.expected;
 for(const [meaning,source] of [['自己写的意思','manual'],['其他来源的意思','词库导入']] as const){const db=openDb(':memory:');try{installVocabulary(db,{...catalog,version:140,entries:[{...e,meaning:old,meaningCorrection:undefined}]});db.prepare('UPDATE words SET meaning_zh=?,meaning_source=? WHERE headword=?').run(meaning,source,'pack');installVocabulary(db,{...catalog,entries:[e]});expect(db.prepare('SELECT meaning_zh,meaning_source FROM words WHERE headword=?').get('pack')).toEqual({meaning_zh:meaning,meaning_source:source});}finally{db.close()}}
 const db=openDb(':memory:');try{db.prepare("INSERT INTO words(headword,meaning_zh,source) VALUES ('pack','个人原有核心词','kb2022')").run();installVocabulary(db,{...catalog,entries:[e]});expect(db.prepare("SELECT meaning_zh,source FROM words WHERE headword='pack'").get()).toEqual({meaning_zh:'个人原有核心词',source:'kb2022'});}finally{db.close()}
});
