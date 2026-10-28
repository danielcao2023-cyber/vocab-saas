import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 supplies vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1827,'supply'],[1828,'typhoon'],[1829,'in the open air'],[1830,'hurricane'],[1831,'pipe'],[1832,'whistle']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['supply','typhoon','hurricane','pipe','whistle']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
