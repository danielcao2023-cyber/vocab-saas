import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 variety vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1873,'variety'],[1874,'major'],[1875,'no matter where'],[1876,'no matter who'],[1877,'no matter what'],[1878,'dialect']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['variety','major','dialect']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
