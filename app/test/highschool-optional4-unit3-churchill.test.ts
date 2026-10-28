import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('fills both missing sailor names while preserving manual meanings',()=>{
 const words=['Zac Sunderland','Robin Lee Graham'];
 const entries=catalog.entries.filter(e=>words.includes(e.headword));expect(entries).toHaveLength(2);
 const db=openDb(':memory:');try{
  const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  expect(old.map(e=>e.meaning)).toEqual(['无','无']);
  installVocabulary(db,{...catalog,entries:old});installVocabulary(db,{...catalog,entries});
  const get=db.prepare('select meaning_zh from words where headword=?');
  for(const entry of entries)expect(get.get(entry.headword)).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entries[0].headword);
  installVocabulary(db,{...catalog,entries});expect(get.get(entries[0].headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
