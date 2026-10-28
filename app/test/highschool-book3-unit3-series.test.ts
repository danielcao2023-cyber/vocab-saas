import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 3 series vocabulary and corrects the phrase',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2471,'claim'],[2472,'series'],[2473,'series of'],[2474,'apart from'],[2475,'minority'],[2476,'escape'],[2477,'bring about'],[2478,'Atlantic'],[2479,'financial'],[2480,'poetry']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['series','minority','escape','Atlantic','financial','poetry']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='series of')?.meaning).toContain('一系列');
});
