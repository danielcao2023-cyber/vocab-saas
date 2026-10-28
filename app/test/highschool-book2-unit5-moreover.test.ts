import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 5 vocabulary and sound mappings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2235,'moreover'],[2236,'satisfaction'],[2237,'being'],[2238,'various'],[2239,'somehow'],[2240,'rhetorical'],[2241,'metaphor'],[2242,'personification'],[2243,'repetition'],[2244,'simile'],[2245,'outline'],[2246,'reaction']] as const) {expect(read({id,headword}).status,headword).toBe('ready');expect(getSoundSpellingLesson(headword),headword).toBeDefined();}
 expect(catalog.entries.find(e=>e.headword==='metaphor')).toMatchObject({phonetic:'/ˈmetəfɔːr/',phoneticCorrection:{expected:'[ˈmetəfərˌˈmetəfɔːr]'}});
});
