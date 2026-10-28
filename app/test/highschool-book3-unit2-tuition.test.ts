import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 2 tuition vocabulary and corrects meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2359,'carry sb. through sth.'],[2360,'marriage'],[2361,'majority'],[2362,'complain'],[2363,'tuition'],[2364,'fee'],[2365,'tuition fees'],[2366,'respond'],[2367,'response']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['marriage','majority','complain','tuition','respond','response']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='carry sb. through sth.')?.meaning).toContain('帮助');
 expect(catalog.entries.find(e=>e.headword==='tuition fees')?.meaning).toBe('n. 学费');
});
