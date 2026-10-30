import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 1 overseas vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1952,'overseas'],[1953,'exit'],[1954,'sheet'],[1955,'parade'],[1956,'roof'],[1957,'chiwen'],[1958,'forgive'],[1959,'forgave'],[1960,'forgiven']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['overseas','exit','sheet','parade','roof','forgive','forgave','forgiven']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('upgrades only the old imported chiwen meaning and preserves a custom meaning',()=>{
 const db=openDb(':memory:');try{const entry=catalog.entries.find(e=>e.key==='chiwen')!;const mini={...catalog,entries:[{...entry,meaning:'无',meaningCorrection:undefined}]};installVocabulary(db,mini);const id=(db.prepare("select id from words where headword='chiwen'").get() as {id:number}).id;installVocabulary(db,{...mini,entries:[entry]});expect(db.prepare('select meaning_zh from words where id=?').get(id)).toEqual({meaning_zh:entry.meaning});db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where id=?").run(id);installVocabulary(db,{...mini,entries:[entry]});expect(db.prepare('select meaning_zh from words where id=?').get(id)).toEqual({meaning_zh:'自定义'});}finally{db.close();}
});
it('distinguishes the Chinese pinyin of chiwen from an unverified English pronunciation',()=>{
 const lesson=createLessonReader()({id:1957,headword:'chiwen'});
 expect(lesson.status).toBe('ready');
 if(lesson.status!=='ready') throw Error('missing lesson');
 expect(lesson.lesson.takeaway).toContain('chī wěn');
 expect(lesson.lesson.takeaway).toContain('汉语拼音');
 expect(lesson.lesson.pronunciation.ipa).toBe('');
});
