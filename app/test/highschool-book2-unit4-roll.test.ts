import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 4 vocabulary and multisyllable mappings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2157,'roll'],[2159,'cattle'],[2160,'roar'],[2162,'pub'],[2163,'wine'],[2164,'beer'],[2166,'custom'],[2158,'dot'],[2161,'scent'],[2165,'stew'],[2167,'sensory'],[2168,'striking'],[2169,'transition'],[2170,'crowd']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['sensory','striking','transition','cattle','custom']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
