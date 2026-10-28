import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('corrects Tasmania phonetics only when the original imported value remains',()=>{
 const entry=catalog.entries.find(e=>e.headword==='Tasmania')!;
 expect(entry.phoneticCorrection?.expected).toBe('[tæzˈmenjə]');expect(entry.phonetic).toBe('[tæzˈmeɪniə]');
 const db=openDb(':memory:');try{
  const old={...entry,phonetic:entry.phoneticCorrection!.expected,phoneticCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});installVocabulary(db,{...catalog,entries:[entry]});
  const get=db.prepare('select phonetic from words where headword=?');expect(get.get(entry.headword)).toEqual({phonetic:entry.phonetic});
  db.prepare("update words set phonetic='自定义',meaning_source='manual' where headword=?").run(entry.headword);
  installVocabulary(db,{...catalog,entries:[entry]});expect(get.get(entry.headword)).toEqual({phonetic:'自定义'});
 }finally{db.close();}
});
