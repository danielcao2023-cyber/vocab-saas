import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 1 vocabulary with corrected phrases',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2316,'pleased'],[2317,'frank'],[2318,'to be frank'],[2319,'go off'],[2320,'except for'],[2321,'inner'],[2322,'autonomous'],[2323,'region']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['inner','autonomous','region']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='except for')?.meaning).toContain('除');
 expect(catalog.entries.find(e=>e.headword==='go off')?.meaning).toContain('响起');
});
