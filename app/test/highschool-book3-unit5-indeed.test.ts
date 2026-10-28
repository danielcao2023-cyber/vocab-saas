import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 5 indeed vocabulary and clarifies permit pronunciation',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2666,'indeed'],[2667,'willing'],[2668,'be willing to do sth.'],[2669,'element'],[2670,'plot'],[2671,'ambassador'],[2672,'upper-class'],[2673,'upper'],[2674,'the upper class'],[2675,'maintain'],[2676,'permission'],[2677,'permit'],[2678,'saying'],[2679,'external']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['indeed','willing','element','ambassador','upper','maintain','permission','permit','saying','external']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='upper-class')).toMatchObject({phonetic:'/ˌʌpərˈklæs/',phoneticCorrection:{expected:'[ði ˌʌpər ˈklæs]'}});
});
