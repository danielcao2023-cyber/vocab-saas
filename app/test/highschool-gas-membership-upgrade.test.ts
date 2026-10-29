import {expect,it} from 'vitest';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';

it('adds gas to Unit 4 without duplicating it or changing existing identity, evidence or memberships',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
 const entry=catalog.entries.find((e:any)=>e.key==='gas');
 expect(entry.memberships).toContainEqual({bookId:'pep2019-compulsory-1',unitId:'pep2019-compulsory-1:unit4',position:328});
 expect(entry.memberships.some((m:any)=>m.unitId==='pep2019-compulsory-1:unit5')).toBe(true);
 const previous=structuredClone(catalog);previous.version=catalog.version-1;
 previous.entries.find((e:any)=>e.key==='gas').memberships=entry.memberships.filter((m:any)=>m.unitId!=='pep2019-compulsory-1:unit4');
 const db=openDb(':memory:');try{
  installVocabulary(db,previous);
  const word=db.prepare("SELECT id FROM words WHERE headword='gas'").get() as {id:number};
  const before=db.prepare("SELECT book_id,unit_id,position FROM vocabulary_members WHERE word_id=? ORDER BY book_id,unit_id").all(word.id);
  db.prepare("INSERT INTO wrong_words(word_id,last_wrong_at,wrong_count) VALUES (?,datetime('now'),2)").run(word.id);
  installVocabulary(db,catalog);installVocabulary(db,catalog);
  expect(db.prepare("SELECT id FROM words WHERE headword='gas'").all()).toEqual([word]);
  expect(db.prepare('SELECT word_id,wrong_count FROM wrong_words WHERE word_id=?').get(word.id)).toEqual({word_id:word.id,wrong_count:2});
  expect(db.prepare("SELECT book_id,unit_id,position FROM vocabulary_members WHERE word_id=? AND unit_id!='pep2019-compulsory-1:unit4' ORDER BY book_id,unit_id").all(word.id)).toEqual(before);
  expect(db.prepare("SELECT position FROM vocabulary_members WHERE word_id=? AND unit_id='pep2019-compulsory-1:unit4'").get(word.id)).toEqual({position:328});
 }finally{db.close();}
});
