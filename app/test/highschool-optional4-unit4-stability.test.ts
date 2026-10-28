import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('corrects country and phrase meanings while preserving manual edits',()=>{
 const words=['Papua New Guinea','pray that','bounce around'];
 const entries=catalog.entries.filter(e=>words.includes(e.headword));expect(entries).toHaveLength(3);
 const db=openDb(':memory:');try{
  const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:old});installVocabulary(db,{...catalog,entries});
  const get=db.prepare('select meaning_zh from words where headword=?');
  for(const e of entries)expect(get.get(e.headword)).toEqual({meaning_zh:e.meaning});
  for(const e of entries)db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(e.headword);
  installVocabulary(db,{...catalog,entries});for(const e of entries)expect(get.get(e.headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
