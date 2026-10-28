import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';

it('corrects the science terms on upgrade without overwriting a manual definition',()=>{
 const entries=catalog.entries.filter(e=>['the big bang theory','the Jet Propulsion Laboratory'].includes(e.headword));
 expect(entries).toHaveLength(2);
 expect(entries.find(e=>e.headword==='the big bang theory')?.meaning).toBe('宇宙大爆炸理论');
 expect(entries.find(e=>e.headword==='the Jet Propulsion Laboratory')?.meaning).toBe('喷气推进实验室（JPL）');
 const db=openDb(':memory:');
 try{
  const previous=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:previous});
  db.prepare("update words set meaning_zh='自定义释义',meaning_source='manual' where headword='the Jet Propulsion Laboratory'").run();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare("select meaning_zh from words where headword='the big bang theory'").get()).toEqual({meaning_zh:'宇宙大爆炸理论'});
  expect(db.prepare("select meaning_zh from words where headword='the Jet Propulsion Laboratory'").get()).toEqual({meaning_zh:'自定义释义'});
 }finally{db.close();}
});
