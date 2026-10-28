import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';

it('corrects the food terms on upgrade without overwriting a manual definition',()=>{
 const entries=catalog.entries.filter(e=>['lamb kebab','slice ... off'].includes(e.headword));
 expect(entries).toHaveLength(2);
 expect(entries.find(e=>e.headword==='lamb kebab')?.meaning).toBe('烤羊肉串');
 expect(entries.find(e=>e.headword==='slice ... off')?.meaning).toBe('切下；切掉（某部分）');
 const db=openDb(':memory:');
 try{
  const previous=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:previous});
  db.prepare("update words set meaning_zh='自定义释义',meaning_source='manual' where headword='slice ... off'").run();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare("select meaning_zh from words where headword='lamb kebab'").get()).toEqual({meaning_zh:'烤羊肉串'});
  expect(db.prepare("select meaning_zh from words where headword='slice ... off'").get()).toEqual({meaning_zh:'自定义释义'});
 }finally{db.close();}
});
