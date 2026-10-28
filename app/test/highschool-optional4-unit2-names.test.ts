import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('upgrades misleading names and preserves learner edits',()=>{
 const entries=['Aborigine','the Bay of Islands','the haka','Edmonds','Felicity','Tasmanian devil'].map(w=>catalog.entries.find(e=>e.headword===w)!);
 expect(entries[0].meaning).toContain('冒犯');expect(entries[4].meaning).toContain('人名');expect(entries[5].meaning).toContain('袋獾');
 const db=openDb(':memory:');try{
  const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));
  installVocabulary(db,{...catalog,entries:old});installVocabulary(db,{...catalog,entries});
  const get=db.prepare('select meaning_zh from words where headword=?');
  for(const e of entries)expect(get.get(e.headword)).toEqual({meaning_zh:e.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='Felicity'").run();
  installVocabulary(db,{...catalog,entries});expect(get.get('Felicity')).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
