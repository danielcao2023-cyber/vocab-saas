import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('corrects the former country name without overwriting a user edit',()=>{
 const entry=catalog.entries.find(e=>e.headword==="Ceylon")!;
 expect(entry.meaningCorrection?.expected).toBe('n. 锡兰（印度以南一岛国，现以更名为斯里兰卡Srilanka）');
 expect(entry.meaning).toContain('斯里兰卡');
 const db=openDb(':memory:');try{
  const old={...entry,meaning:entry.meaningCorrection!.expected,meaningCorrection:undefined};
  installVocabulary(db,{...catalog,entries:[old]});
  installVocabulary(db,{...catalog,entries:[entry]});
  const get=db.prepare('select meaning_zh from words where headword=?');
  expect(get.get(entry.headword)).toEqual({meaning_zh:entry.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entry.headword);
  installVocabulary(db,{...catalog,entries:[entry]});
  expect(get.get(entry.headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
