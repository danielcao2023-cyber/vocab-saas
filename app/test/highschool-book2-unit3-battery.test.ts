import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 3 battery vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2085,'battery'],[2086,'confirm'],[2087,'Wi-Fi'],[2088,'button'],[2089,'file'],[2090,'in shape'],[2091,'keep track of'],[2092,'discount'],[2093,'privacy'],[2094,'theft'],[2095,'rude'],[2096,'target']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['battery','confirm','button','discount','privacy','target']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('updates only matching imported meanings and preserves manual changes',()=>{
 const db=openDb(':memory:');try{
  const entries=catalog.entries.filter(e=>['Wi-Fi','in shape','theft'].includes(e.headword));expect(entries).toHaveLength(3);
  const mini={...catalog,entries:entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}))};installVocabulary(db,mini);installVocabulary(db,{...mini,entries});
  for(const e of entries) expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entries[0].headword);installVocabulary(db,{...mini,entries});
  expect(db.prepare('select meaning_zh from words where headword=?').get(entries[0].headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
