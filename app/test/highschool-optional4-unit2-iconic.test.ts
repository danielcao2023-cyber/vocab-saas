import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('upgrades missing names and iconic meaning without replacing user edits',()=>{
 const entries=['Gladys Claffern','The Three-Body Problem','Hugo Award','iconic'].map(w=>catalog.entries.find(e=>e.headword===w)!);
 expect(entries[3].meaning).toContain('标志性');
 const db=openDb(':memory:');try{
  const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:old});installVocabulary(db,{...catalog,entries});
  const get=db.prepare('select meaning_zh from words where headword=?');
  for(const e of entries)expect(get.get(e.headword)).toEqual({meaning_zh:e.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='iconic'").run();
  installVocabulary(db,{...catalog,entries});expect(get.get('iconic')).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
