import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 strike vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1839,'strike'],[1840,'struck'],[1841,'stricken'],[1842,'deliver'],[1843,'summary'],[1844,'length']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['strike','struck','stricken','deliver','summary','length']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
