import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 3 Unit 1 range vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2265,'after all'],[2266,'range'],[2267,'range from ... to ...'],[2268,'origin'],[2269,'religion'],[2270,'religious'],[2271,'figure'],[2272,'charm'],[2273,'joyful'],[2274,'gratitude']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['origin','religion','religious','figure','joyful','gratitude'])expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='after all')).toMatchObject({meaningCorrection:{expected:'na. 毕竟；终究；最后'}});
});
