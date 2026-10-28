import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 3 Unit 1 festival vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2255,'carnival'],[2256,'costume'],[2257,'dress up'],[2258,'dress sb. up'],[2259,'march'],[2260,'congratulate'],[2261,'riddle'],[2262,'ceremony'],[2263,'samba'],[2264,'make-up']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['carnival','costume','congratulate','riddle','ceremony','samba'])expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='march')).toMatchObject({meaningCorrection:{expected:'n. 三月'}});
});
