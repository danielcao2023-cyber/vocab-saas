import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 4 defence vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2133,'defence'],[2134,'legal'],[2135,'surround'],[2136,'evidence'],[2137,'achievement'],[2138,'location'],[2139,'conquer'],[2140,'battle'],[2141,'port'],[2142,'fascinating'],[2143,'keep your eyes open'],[2144,'keep your eyes open for']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['defence','legal','surround','evidence','achievement','location','conquer','battle','fascinating']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('updates only matching imported phrase meaning and preserves manual changes',()=>{
 const db=openDb(':memory:');try{const e=catalog.entries.find(e=>e.headword==='keep your eyes open for')!;
  const old={...catalog,entries:[{...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}]};installVocabulary(db,old);installVocabulary(db,{...old,entries:[e]});
  expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});
  db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword=?").run(e.headword);installVocabulary(db,{...old,entries:[e]});
  expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:'自定义'});
 }finally{db.close();}
});
