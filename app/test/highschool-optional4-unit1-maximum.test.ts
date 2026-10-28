import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('upgrades Larry Belmont’s missing meaning and preserves user edits',()=>{
 const entry=catalog.entries.find(e=>e.headword==='Larry Belmont')!;
 expect(entry.meaningCorrection?.expected).toBe('无');expect(entry.meaning).toContain('拉里');
 const db=openDb(':memory:');try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});installVocabulary(db,{...catalog,entries:[entry]});
  const get=db.prepare('select meaning_zh from words where headword=?');expect(get.get(entry.headword)).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entry.headword);
  installVocabulary(db,{...catalog,entries:[entry]});expect(get.get(entry.headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
