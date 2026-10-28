import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('corrects recreation pronunciation without overwriting a manual edit',()=>{
 const word='recreation',entry=catalog.entries.find(e=>e.headword===word)!;
 expect(entry.phonetic).toBe('[ˌrekriˈeɪʃən]');
 const db=openDb(':memory:');try{
  const old={...entry,phonetic:entry.phoneticCorrection!.expected,phoneticCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});installVocabulary(db,{...catalog,entries:[entry]});
  const select=db.prepare('select phonetic from words where headword=?');expect(select.get(word)).toEqual({phonetic:entry.phonetic});
  db.prepare("update words set phonetic='custom',meaning_source='manual' where headword=?").run(word);
  installVocabulary(db,{...catalog,entries:[entry]});expect(select.get(word)).toEqual({phonetic:'custom'});
 }finally{db.close();}
});
