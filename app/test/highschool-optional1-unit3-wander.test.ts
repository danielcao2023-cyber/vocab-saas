import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 3 amusement vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2881,'adorable'],[2882,'wander'],[2883,'amusement'],[2884,'amuse'],[2885,'enormous'],[2886,'swing'],[2887,'swung'],[2888,'iron'],[2889,'rare'],[2890,'steam'],[2891,'superb'],[2892,'aquarium'],[2893,'up to'],[2894,'polar'],[2895,'upside down']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['adorable','wander','amusement','amuse','enormous','superb','aquarium','polar']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
