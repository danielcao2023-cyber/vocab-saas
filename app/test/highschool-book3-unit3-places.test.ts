import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 3 places and corrects location meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2501,'contain'],[2502,'neat'],[2503,'San Francisco'],[2504,'Napa Valley'],[2505,'the Golden Gate Bridge'],[2506,'the Mission District'],[2507,'Mexico'],[2508,'California'],[2509,'Cantonese'],[2510,'the Richmond District']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['contain','Mexico','California','Cantonese']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='the Mission District')?.meaning).toContain('教会区');
 expect(catalog.entries.find(e=>e.headword==='the Golden Gate Bridge')?.meaning).not.toContain('全门');
});
