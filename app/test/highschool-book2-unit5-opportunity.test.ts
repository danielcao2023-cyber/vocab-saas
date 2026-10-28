import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 5 vocabulary and sound mappings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2193,'opportunity'],[2194,'performance'],[2195,'performer'],[2196,'onto'],[2197,'studio'],[2198,'ordinary'],[2199,'enable'],[2200,'composer'],[2201,'conductor'],[2202,'fall in love with']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['opportunity','performance','performer','onto','studio','ordinary','enable','composer','conductor']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
