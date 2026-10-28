import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 2 threaten vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2035,'threaten'],[2036,'exist'],[2037,'harmony'],[2038,'goods'],[2039,'creature'],[2040,'deer'],[2041,'kangaroo'],[2042,'due'],[2043,'due to'],[2044,'net'],[2045,'neighbourhood'],[2046,'binoculars']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['threaten','exist','harmony','creature','kangaroo','neighbourhood','binoculars']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
