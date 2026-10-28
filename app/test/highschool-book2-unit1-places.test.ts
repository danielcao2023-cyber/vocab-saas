import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 1 place vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1972,'Aswan Dam'],[1973,'the Nile'],[1974,'Egypt'],[1975,'Egyptian'],[1976,'UNESCO'],[1977,'United Nations Educational, Scientific and Cultural Organization'],[1978,'Cairo'],[1979,'Tanzania'],[1980,'the Kremlin'],[1981,'Moscow'],[1982,"Saint Basil's Cathedral"],[1983,'the Forbidden City'],[1984,'Los Angeles']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Egypt','Egyptian','UNESCO','Cairo','Tanzania','Moscow']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('corrects only expected imported place meanings while preserving manual values',()=>{
 const db=openDb(':memory:');try{const entries=catalog.entries.filter(e=>['the Nile','the Kremlin',"Saint Basil's Cathedral"].includes(e.headword));expect(entries).toHaveLength(3);const old=entries.map(e=>({...e,meaning:e.meaningCorrection!.expected,meaningCorrection:undefined}));const mini={...catalog,entries:old};installVocabulary(db,mini);installVocabulary(db,{...mini,entries});for(const e of entries)expect(db.prepare('select meaning_zh from words where headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});db.prepare("update words set meaning_zh='自定义',meaning_source='manual' where headword='the Nile'").run();installVocabulary(db,{...mini,entries});expect(db.prepare("select meaning_zh from words where headword='the Nile'").get()).toEqual({meaning_zh:'自定义'});}finally{db.close();}
});
