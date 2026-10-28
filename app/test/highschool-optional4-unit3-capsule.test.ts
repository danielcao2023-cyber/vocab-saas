import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('adds the missing submersible noun meaning without overwriting a user edit',()=>{
 const entry=catalog.entries.find(e=>e.headword==="submersible")!;
 expect(entry.meaningCorrection?.expected).toBe('adj. 能潜水的；能沉入水中的');
 expect(entry.meaning).toContain('潜水器');
 const db=openDb(':memory:');try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});
  installVocabulary(db,{...catalog,entries:[entry]});
  const get=db.prepare('select meaning_zh from words where headword=?');
  expect(get.get(entry.headword)).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entry.headword);
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(get.get(entry.headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
