import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 3 landscape vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2836,'Melbourne'],[2837,'Christian'],[2838,'buffet'],[2839,'cloth'],[2840,'edge'],[2841,'valley'],[2842,'vast'],[2843,'glacier'],[2844,'reindeer'],[2845,'territory'],[2846,'ban'],[2847,'boundary'],[2848,'cottage'],[2849,'visible'],[2850,'on the move']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Melbourne','Christian','valley','glacier','reindeer','territory','boundary','cottage','visible']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
