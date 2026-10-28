import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import catalog from '../data/vocabulary/catalog.json';
it('provides the remaining Book 2 Unit 5 forms with corrected imported meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2214,'absorbed in sb.'],[2232,'leant'],[2233,'leaned']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['absorbed in sth.','absorbed in sb.','leaned']) expect(catalog.entries.find(e=>e.headword===word),word).toHaveProperty('meaningCorrection.expected');
});
