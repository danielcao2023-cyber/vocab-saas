import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 4 clarification vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2941,'bend'],[2942,'bent'],[2943,'reveal'],[2944,'clarify'],[2945,'in other words'],[2946,'educator'],[2947,'tick'],[2948,'tendency'],[2949,'lower'],[2950,'imply'],[2951,'barely'],[2952,'chin'],[2953,'occupy'],[2954,'stare'],[2955,'ceiling']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['reveal','clarify','educator','tendency','lower','imply','barely','occupy','ceiling']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
