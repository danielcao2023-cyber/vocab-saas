import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 2 vocabulary including tear and quantity expressions',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2420,'tear'],[2421,'in tears'],[2422,'despair'],[2423,'in despair'],[2424,'a great deal'],[2425,'a great deal of'],[2426,'fable'],[2427,'court'],[2428,'flexible'],[2429,'income']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['despair','fable','flexible','income']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
