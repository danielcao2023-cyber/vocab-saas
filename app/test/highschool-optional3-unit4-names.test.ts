import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('fills missing expedition name meanings while preserving user edits',()=>{
 const names=['Perce Blackborow','South Georgia Island','Frank Wild','Thomas Orde-Lees','Frank Worsley','Tom Crean'];
 const entries=names.map(name=>catalog.entries.find(e=>e.headword===name)!);
 const db=openDb(':memory:');try{
  const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:old});installVocabulary(db,{...catalog,entries});
  const select=db.prepare('select meaning_zh from words where headword=?');
  for(const e of entries){expect(e.meaningCorrection!.expected).toBe('无');expect(select.get(e.headword)).toEqual({meaning_zh:e.meaning});}
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(names[0]);
  installVocabulary(db,{...catalog,entries});expect(select.get(names[0])).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
