import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('upgrades kayaking meaning and preserves learner edits',()=>{
 const entry=catalog.entries.find(e=>e.headword==='kayaking')!;
 expect(entry.meaning).toContain('皮划艇运动');expect(entry.meaningCorrection?.expected).toContain('独木舟');
 const db=openDb(':memory:');try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});installVocabulary(db,{...catalog,entries:[entry]});
  const get=db.prepare('select meaning_zh from words where headword=?');expect(get.get('kayaking')).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='kayaking'").run();
  installVocabulary(db,{...catalog,entries:[entry]});expect(get.get('kayaking')).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
