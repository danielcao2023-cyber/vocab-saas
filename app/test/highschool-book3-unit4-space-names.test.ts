import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides space names and corrects missing or misleading textbook meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2596,'Sputnik'],[2597,'the USSR'],[2598,'the Union of Soviet Socialist Republics'],[2599,'Yuri Gagarin'],[2600,'Neil Armstrong'],[2601,'NASA'],[2602,'National Aeronautics and Space Administration'],[2603,'Voyager'],[2604,'Soyuz'],[2605,'Challenger'],[2606,'the International Space Station'],[2607,'Jade Rabbit'],[2608,'Mars'],[2609,'Jupiter']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Voyager','Challenger','Jupiter']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 for(const word of ['the Union of Soviet Socialist Republics','Voyager','Soyuz','Challenger','the International Space Station','Jade Rabbit']) expect(catalog.entries.find(e=>e.headword===word),word).toHaveProperty('meaningCorrection.expected');
});
