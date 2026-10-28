import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 facility vocabulary and corrects result in',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2567,'microwave oven'],[2568,'tissue'],[2569,'facility'],[2570,'keen'],[2571,'globe'],[2572,'argument'],[2573,'fatal'],[2574,'shallow'],[2575,'result in'],[2576,'pattern']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['tissue','facility','argument','fatal','shallow','pattern']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='result in')?.meaning).toContain('导致');
});
