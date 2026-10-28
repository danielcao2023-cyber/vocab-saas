import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 5 previous vocabulary and sound mappings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2213,'absorbed in sth.'],[2215,'previous'],[2216,'unemployed'],[2217,'romantic'],[2218,'album'],[2219,'impact'],[2220,'set sth. up'],[2221,'equipment'],[2222,'try out']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['previous','unemployed','romantic','album','impact','equipment']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
