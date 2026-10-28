import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('corrects imported online-safety meanings and preserves manual meanings',()=>{
 const db=openDb(':memory:');try{
  const entries=catalog.entries.filter(e=>['troll','cyberbully'].includes(e.headword));expect(entries).toHaveLength(2);
  const old={...catalog,entries:entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}))};
  installVocabulary(db,old);installVocabulary(db,{...old,entries});
  for(const e of entries) expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entries[0].headword);
  installVocabulary(db,{...old,entries});
  expect(db.prepare('select meaning_zh from words where headword=?').get(entries[0].headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
