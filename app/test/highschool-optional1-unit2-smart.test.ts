import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 2 smart home vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2773,'remote control'],[2774,'air conditioner'],[2775,'automatic'],[2776,'integrated'],[2777,'integrate'],[2778,'sensor'],[2779,'efficient'],[2780,'mode'],[2781,'routine'],[2782,'daily routine'],[2783,'preference'],[2784,'instant'],[2785,'command']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['automatic','integrated','integrate','sensor','efficient','routine','preference','instant','command']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
