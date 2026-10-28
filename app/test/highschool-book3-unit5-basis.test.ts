import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 and 5 vocabulary with corrected GPS and loan meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2610,'Typhoon Goni'],[2611,'GPS'],[2612,'global positioning system'],[2613,'basis'],[2614,'on the basis of'],[2615,'loan'],[2616,'take out a loan'],[2617,'apologise'],[2618,'apologize'],[2619,'ignore'],[2620,'in return'],[2621,'scene']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['basis','apologise','apologize','ignore']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='GPS')?.meaning).toContain('Global Positioning System');
 expect(catalog.entries.find(e=>e.headword==='Typhoon Goni')?.meaning).toBe('台风天鹅');
});
