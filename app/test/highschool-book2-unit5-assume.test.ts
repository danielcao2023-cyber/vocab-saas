import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 5 assume vocabulary and sound mappings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2223,'assume'],[2224,'addition'],[2225,'in addition'],[2226,'in addition to sb.'],[2227,'in addition to sth.'],[2228,'treatment'],[2230,'from then on'],[2231,'lean'],[2234,'get through']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['assume','addition','treatment']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
