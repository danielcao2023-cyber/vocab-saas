import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('corrects the missing idiom meaning without overwriting a manual meaning',()=>{
 const headword="take sb.'s breath away";
 const entry=catalog.entries.find(e=>e.headword===headword)!;
 expect(entry.meaning).toBe('令某人惊叹');
 const db=openDb(':memory:');
 try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare('select meaning_zh from words where headword=?').get(headword)).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(headword);
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare('select meaning_zh from words where headword=?').get(headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
