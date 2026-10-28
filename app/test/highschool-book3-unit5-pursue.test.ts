import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 5 pursue vocabulary and corrects manner phrase meaning',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2651,'pursue'],[2652,'on duty'],[2653,'hesitate'],[2654,'sequence'],[2655,'eventually'],[2656,'tailor'],[2657,'clerk'],[2658,'in a ... manner'],[2659,'downstairs'],[2660,'stair'],[2661,'aside'],[2662,'frown'],[2663,'in that case'],[2664,'option'],[2665,'broad']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['pursue','hesitate','sequence','eventually','tailor','downstairs','aside','option']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='in a ... manner')).toMatchObject({meaning:'以……的方式',meaningCorrection:{expected:'na. 在某种意义上；多少'}});
});
