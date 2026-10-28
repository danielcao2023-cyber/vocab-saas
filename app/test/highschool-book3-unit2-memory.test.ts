import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 2 memory vocabulary and corrects pass away',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2402,'bite'],[2403,'lip'],[2404,'assist'],[2405,'first aid'],[2406,'pass away'],[2407,'chairman'],[2408,'memory'],[2409,'in memory of'],[2410,'chain']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['assist','chairman','memory']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='pass away')?.meaning).toContain('去世');
});
