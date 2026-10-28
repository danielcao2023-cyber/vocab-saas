import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 3 internet vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2061,'blogger'],[2062,'engine'],[2063,'search engine'],[2064,'stream'],[2065,'identity'],[2066,'identity card'],[2067,'update'],[2068,'database'],[2069,'software'],[2070,'network'],[2071,'stuck'],[2072,'keep sb. company']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['blogger','engine','identity','update','database','software','network']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
