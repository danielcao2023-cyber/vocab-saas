import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 5 essential vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[3031,'pesticide'],[3032,'widespread'],[3033,'bacterium'],[3034,'bacteria'],[3035,'in turn'],[3036,'digest'],[3037,'essential'],[3038,'mineral'],[3039,'alternative'],[3040,'grocery'],[3041,'instance'],[3042,'for instance'],[3043,'depth'],[3044,'root'],[3045,'entirely']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['pesticide','widespread','bacterium','bacteria','digest','essential','mineral','alternative','grocery','instance','entirely']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
