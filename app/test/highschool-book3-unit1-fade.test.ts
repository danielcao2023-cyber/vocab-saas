import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 3 Unit 1 fade vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2285,'fade'],[2286,'fade away'],[2287,'typical'],[2288,'firecracker'],[2289,'evil'],[2290,'in spite of'],[2291,'commercial'],[2292,'commercialise'],[2293,'commercialisation'],[2294,'commercialization']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['typical','firecracker','evil','commercial','commercialise','commercialisation','commercialization'])expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='fade away')?.meaning).toContain('逐渐减弱');
 expect(catalog.entries.find(e=>e.headword==='in spite of')?.meaning).toContain('尽管');
});
