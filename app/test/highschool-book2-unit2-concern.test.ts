import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 2 concern vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2005,'concern'],[2006,'concerned'],[2007,'concerned about'],[2008,'living'],[2009,'adapt'],[2010,'adapt to'],[2011,'measure'],[2012,'authority'],[2013,'under pressure'],[2014,'antelope']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['concern','concerned','living','adapt','measure','authority','antelope']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('corrects only the expected imported adapt to meaning and preserves custom content',()=>{
 const db=openDb(':memory:');try{const e=catalog.entries.find(e=>e.headword==='adapt to')!;const mini={...catalog,entries:[{...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}]};installVocabulary(db,mini);installVocabulary(db,{...mini,entries:[e]});expect(db.prepare("select meaning_zh from words where headword='adapt to'").get()).toEqual({meaning_zh:'适应'});db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='adapt to'").run();installVocabulary(db,{...mini,entries:[e]});expect(db.prepare("select meaning_zh from words where headword='adapt to'").get()).toEqual({meaning_zh:'自定义'});}finally{db.close();}
});
