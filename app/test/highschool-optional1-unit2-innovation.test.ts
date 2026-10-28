import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 2 technology vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2799,'relevant'],[2800,'catch fire'],[2801,'fantasy'],[2802,'innovation'],[2803,'available'],[2804,'in this sense'],[2805,'nevertheless'],[2806,'structure'],[2807,'security'],[2808,'crime'],[2809,'combine'],[2810,'artificial']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['relevant','fantasy','innovation','available','nevertheless','structure','security','combine','artificial']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
