import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 3 downtown vocabulary and corrects head to',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2451,'occur'],[2452,'downtown'],[2453,'mission'],[2454,'district'],[2455,'graffiti'],[2456,'comic'],[2457,'afterwards'],[2458,'head to'],[2459,'historical'],[2460,'seek']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['occur','downtown','mission','district','graffiti','comic','afterwards','historical']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='head to')?.meaning).toContain('前往');
});
