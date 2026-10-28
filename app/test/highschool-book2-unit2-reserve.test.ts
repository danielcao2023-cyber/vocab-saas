import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 2 reserve vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2015,'Tibetan antelope'],[2016,'reserve'],[2017,'plain'],[2018,'make out'],[2019,'herd'],[2020,'observe'],[2021,'beauty'],[2022,'remind sb. of sb.'],[2023,'remind sb. of sth.'],[2024,'fur']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['reserve','plain','herd','observe','beauty','fur']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('corrects expected imported remind meanings while preserving manual changes',()=>{
 const db=openDb(':memory:');try{
  const entries=catalog.entries.filter(e=>['remind sb. of sb.','remind sb. of sth.'].includes(e.headword));
  expect(entries).toHaveLength(2);
  const mini={...catalog,entries:entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}))};
  installVocabulary(db,mini);installVocabulary(db,{...mini,entries});
  for(const e of entries) expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(entries[0].headword);
  installVocabulary(db,{...mini,entries});
  expect(db.prepare('select meaning_zh from words where headword=?').get(entries[0].headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
