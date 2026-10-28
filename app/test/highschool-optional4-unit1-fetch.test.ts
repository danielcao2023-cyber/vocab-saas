import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('upgrades incomplete phrase meanings and preserves user edits',()=>{
 const entries=['fall away','have an urge to'].map(w=>catalog.entries.find(e=>e.headword===w)!);
 expect(entries[0].meaning).toContain('脱落');expect(entries[1].meaning).toContain('冲动');
 const db=openDb(':memory:');try{
  const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:old});
  installVocabulary(db,{...catalog,entries});
  const get=db.prepare('select meaning_zh from words where headword=?');
  expect(get.get('fall away')).toEqual({meaning_zh:entries[0].meaning});expect(get.get('have an urge to')).toEqual({meaning_zh:entries[1].meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='fall away'").run();
  installVocabulary(db,{...catalog,entries});
  expect(get.get('fall away')).toEqual({meaning_zh:'自定义'});expect(get.get('have an urge to')).toEqual({meaning_zh:entries[1].meaning});
 }finally{db.close();}
});
