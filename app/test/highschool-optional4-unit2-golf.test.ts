import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';

it('upgrades the original missing sulphuric pool meaning to the current textbook-context meaning',()=>{
 const entry=catalog.entries.find(e=>e.headword==='sulphuric pool')!;
 expect(entry.meaningCorrection).toEqual({expected:'含硫酸的池塘（字面义）',previous:['无']});
 expect(entry.meaning).toBe('硫黄池（教材地热景点语境）');
 const db=openDb(':memory:');try{
  const old={...entry,meaning:'无',meaningCorrection:undefined};
  installVocabulary(db,{...catalog,version:130,entries:[old]});installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare('select meaning_zh from words where headword=?').get(entry.headword)).toEqual({meaning_zh:entry.meaning});
 }finally{db.close();}
});

it('preserves a learner edit made before the vocabulary upgrade',()=>{
 const entry=catalog.entries.find(e=>e.headword==='sulphuric pool')!;
 const db=openDb(':memory:');try{
  const old={...entry,meaning:'无',meaningCorrection:undefined};
  installVocabulary(db,{...catalog,version:130,entries:[old]});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entry.headword);
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(db.prepare('select meaning_zh, meaning_source from words where headword=?').get(entry.headword)).toEqual({meaning_zh:'自定义',meaning_source:'manual'});
 }finally{db.close();}
});
