import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary,listVocabularyBooks,migrateVocabulary} from '../server/src/vocabulary-import';

const catalog={version:1,books:[{id:'cet4',title:'大学英语四级',category:'exam',edition:'download-2026',sourceUrl:'https://github.com/RealKai42/qwerty-learner'}],units:[],entries:[{key:'ability',headword:'ability',meaning:'能力',phonetic:'/əˈbɪləti/',memberships:[{bookId:'cet4',unitId:null,position:0}]}]};
it('imports books idempotently while sharing exact existing headwords and preserving their content',()=>{
 const db=openDb(':memory:');try{
  db.prepare("INSERT INTO words(id,headword,meaning_zh,source) VALUES (589,'ability','原有已核对释义','kb2022')").run();
  migrateVocabulary(db);installVocabulary(db,catalog);installVocabulary(db,catalog);
  expect(db.prepare('SELECT COUNT(*) n FROM words').get()).toEqual({n:1});
  expect(db.prepare('SELECT word_id FROM vocabulary_members').get()).toEqual({word_id:589});
  expect(db.prepare('SELECT meaning_zh FROM words').get()).toEqual({meaning_zh:'原有已核对释义'});
  expect(listVocabularyBooks(db)[0]).toMatchObject({id:'cet4',wordCount:1,units:[]});
 }finally{db.close();}
});
it('adds a new word once and keeps its ID on later catalog additions',()=>{
 const db=openDb(':memory:');try{
  migrateVocabulary(db);installVocabulary(db,catalog);const first=db.prepare('SELECT id FROM words').get();
  installVocabulary(db,{...catalog,version:2,entries:[...catalog.entries,{key:'abacus',headword:'abacus',meaning:'算盘',memberships:[{bookId:'cet4',unitId:null,position:1}]}]});
  expect(db.prepare("SELECT id FROM words WHERE headword='ability'").get()).toEqual(first);
  expect(db.prepare('SELECT COUNT(*) n FROM words').get()).toEqual({n:2});
  expect(db.prepare('SELECT COUNT(*) n FROM cards').get()).toEqual({n:0});
  expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:0});
 }finally{db.close();}
});
it('matches split curriculum headwords but preserves case distinctions',()=>{
 const db=openDb(':memory:');try{
  db.prepare("INSERT INTO words(id,headword,source) VALUES (1,'actor / actress','kb2022'),(2,'Miss','kb2022'),(3,'miss','kb2022')").run();
  migrateVocabulary(db);installVocabulary(db,{...catalog,entries:[{...catalog.entries[0],key:'actress',headword:'actress'},{...catalog.entries[0],key:'miss',headword:'miss'}]});
  expect(db.prepare("SELECT word_id FROM vocabulary_entry_map WHERE entry_key='actress'").get()).toEqual({word_id:1});
  expect(db.prepare("SELECT word_id FROM vocabulary_entry_map WHERE entry_key='miss'").get()).toEqual({word_id:3});
 }finally{db.close();}
});
it('rolls back a catalog with an invalid unit relationship',()=>{
 const db=openDb(':memory:');try{
  migrateVocabulary(db);expect(()=>installVocabulary(db,{...catalog,entries:[{...catalog.entries[0],memberships:[{bookId:'cet4',unitId:'missing',position:0}]}]})).toThrow();
  expect(db.prepare('SELECT COUNT(*) n FROM words').get()).toEqual({n:0});
  expect(listVocabularyBooks(db)).toEqual([]);
 }finally{db.close();}
});
