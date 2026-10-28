import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('repairs imported Canadian place meanings while preserving manual definitions',()=>{
 const names=['Jasper','Edmonton','Ontario'];
 const entries=catalog.entries.filter(e=>names.includes(e.headword));
 expect(entries).toHaveLength(3);
 expect(entries.find(e=>e.headword==='Jasper')?.meaning).toContain('贾斯珀');
 expect(entries.find(e=>e.headword==='Ontario')?.meaning).toContain('安大略省');
 expect(entries.find(e=>e.headword==='Edmonton')?.meaning).toContain('阿尔伯塔省');
 const db=openDb(':memory:');try{
  const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:old});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='Jasper'").run();
  installVocabulary(db,{...catalog,entries});
  expect(db.prepare("select meaning_zh from words where headword='Jasper'").get()).toEqual({meaning_zh:'自定义'});
  for(const e of entries.filter(e=>e.headword!=='Jasper'))expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});
 }finally{db.close();}
});
