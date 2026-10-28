import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it.each([
 ['out of shape','身体状况不佳；变形'],
 ['CPR','心肺复苏术（急救）；加拿大太平洋铁路、现行页面寄存器（其他语境）'],
 ['mouth-to-mouth rescue breathing','口对口人工呼吸'],
])('updates the imported meaning of %s while preserving user edits',(word,meaning)=>{
 const entry=catalog.entries.find(e=>e.headword===word)!;
 expect(entry.meaning).toBe(meaning);
 const db=openDb(':memory:');
 try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});
  installVocabulary(db,{...catalog,entries:[entry]});
  const select=db.prepare('select meaning_zh from words where headword=?');
  expect(select.get(word)).toEqual({meaning_zh:meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(word);
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(select.get(word)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
