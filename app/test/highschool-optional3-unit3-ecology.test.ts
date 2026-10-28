import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('corrects methane without replacing a user-edited meaning',()=>{
 const word='methane',entry=catalog.entries.find(e=>e.headword===word)!;
 expect(entry.meaning).toBe('甲烷（沼气的主要成分之一）');
 const db=openDb(':memory:');try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});installVocabulary(db,{...catalog,entries:[entry]});
  const select=db.prepare('select meaning_zh from words where headword=?');expect(select.get(word)).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(word);
  installVocabulary(db,{...catalog,entries:[entry]});expect(select.get(word)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
