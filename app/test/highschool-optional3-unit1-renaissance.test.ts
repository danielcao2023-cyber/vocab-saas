import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it.each([
 ['bring ... to life','使生动；赋予生命；使苏醒'],
 ['The Middle Ages','欧洲中世纪（古典时代之后、近代早期之前）'],
])('updates imported meaning of %s without overwriting user edits',(word,meaning)=>{
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
