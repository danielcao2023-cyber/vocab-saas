import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('repairs the imported meaning of zone without overwriting a manual meaning',()=>{
 const entry=catalog.entries.find(e=>e.headword==='zone')!;
 expect(entry.meaning).toBe('n. 地区；区域；地带');
 const db=openDb(':memory:');
 try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare("select meaning_zh from words where headword='zone'").get()).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='zone'").run();
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare("select meaning_zh from words where headword='zone'").get()).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
