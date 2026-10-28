import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it.each([
 ["People's Liberation Army",'中国人民解放军'],
 ['Lao Zi','老子（中国古代思想传统中的人物）'],
])('updates imported meaning for %s without overwriting user edits',(word,meaning)=>{
 const entry=catalog.entries.find(e=>e.headword===word)!;expect(entry.meaning).toBe(meaning);
 const db=openDb(':memory:');try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});installVocabulary(db,{...catalog,entries:[entry]});
  const select=db.prepare('select meaning_zh from words where headword=?');expect(select.get(word)).toEqual({meaning_zh:meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(word);
  installVocabulary(db,{...catalog,entries:[entry]});expect(select.get(word)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
