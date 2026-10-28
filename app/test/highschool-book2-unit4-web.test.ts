import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 3 and Unit 4 vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2109,'the World Wide Web'],[2110,'WWW'],[2111,'Jan Tchamani'],[2112,'Birmingham'],[2113,'Confucius'],[2114,'mansion'],[2115,'cemetery'],[2116,'philosophy'],[2117,'descendant'],[2118,'individual'],[2119,'heel'],[2120,"Achilles' heel"]] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Confucius','mansion','cemetery','philosophy','descendant','individual']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('updates only matching imported meanings and preserves manual changes',()=>{
 const db=openDb(':memory:');try{
  const entries=catalog.entries.filter(e=>['Jan Tchamani',"Achilles' heel"].includes(e.headword));expect(entries).toHaveLength(2);
  const old={...catalog,entries:entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}))};installVocabulary(db,old);installVocabulary(db,{...old,entries});
  for(const e of entries) expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entries[0].headword);installVocabulary(db,{...old,entries});
  expect(db.prepare('select meaning_zh from words where headword=?').get(entries[0].headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
