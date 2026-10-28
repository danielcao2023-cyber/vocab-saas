import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 1 theory vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2725,'politician'],[2726,'numerous'],[2727,'theory'],[2728,'relativity'],[2729,'formula'],[2730,'genius'],[2731,'gentle'],[2732,'patent'],[2733,'passion'],[2734,'doctorate'],[2735,'extraordinary'],[2736,'gradually'],[2737,'photoelectric'],[2738,'come to power'],[2739,'institution'],[2740,'institute']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['politician','numerous','theory','relativity','formula','genius','gentle','patent','passion','doctorate','extraordinary','gradually','photoelectric','institution','institute']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
