import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 2 retirement vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2386,'retire'],[2387,'saving'],[2388,'kindergarten'],[2389,'principle'],[2390,'passive'],[2391,'scared'],[2392,'sharp'],[2393,'insurance']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['retire','saving','kindergarten','principle','passive','insurance']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
