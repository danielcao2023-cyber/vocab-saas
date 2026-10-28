import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 2 introductory vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2763,'phrase'],[2764,'persuade'],[2765,'switch'],[2766,'switch off'],[2767,'switch on'],[2768,'distant'],[2769,'secure'],[2770,'knob'],[2771,'appliance'],[2772,'remote']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['persuade','distant','secure','appliance','remote']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
