import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('repairs the imported meaning of IV needle without overwriting a manual meaning',()=>{
 const entry=catalog.entries.find(e=>e.headword==='IV needle')!;
 expect(entry.meaning).toBe('静脉输液针');
 const db=openDb(':memory:');
 try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare("select meaning_zh from words where headword='IV needle'").get()).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='IV needle'").run();
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare("select meaning_zh from words where headword='IV needle'").get()).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
