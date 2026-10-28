import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 3 Unit 1 agricultural vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2275,'harvest'],[2276,'agricultural'],[2277,'agriculture'],[2278,'crop'],[2279,'gather'],[2280,'grateful'],[2281,'feature'],[2282,'decorate'],[2283,'church'],[2284,'significant']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['harvest','agricultural','agriculture','gather','grateful','feature','decorate','significant'])expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='significant')?.meaning).not.toContain('有效');
});
