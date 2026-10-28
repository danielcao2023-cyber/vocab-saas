import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';

it('corrects the participation phrases on upgrade without overwriting a manual definition',()=>{
 const entries=catalog.entries.filter(e=>['speak up','get involved in'].includes(e.headword));
 expect(entries).toHaveLength(2);
 expect(entries.find(e=>e.headword==='speak up')?.meaning).toBe('大声说；大胆发言');
 expect(entries.find(e=>e.headword==='get involved in')?.meaning).toBe('参与；卷入');
 const db=openDb(':memory:');
 try{
  const previous=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:previous});
  db.prepare("update words set meaning_zh='自定义释义',meaning_source='manual' where headword='get involved in'").run();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare("select meaning_zh from words where headword='speak up'").get()).toEqual({meaning_zh:'大声说；大胆发言'});
  expect(db.prepare("select meaning_zh from words where headword='get involved in'").get()).toEqual({meaning_zh:'自定义释义'});
 }finally{db.close();}
});
