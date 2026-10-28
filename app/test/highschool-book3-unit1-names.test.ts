import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 1 names and corrects textbook-specific meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2339,'Coming-of-Age Day'],[2340,'Rio'],[2341,'Rio de Janeiro'],[2342,'Carla'],[2343,'Halloween'],[2344,'Thanksgiving'],[2345,'Thanksgiving Day'],[2346,'La Tomatina'],[2347,'Buñol'],[2348,'the Naadam festival'],[2349,'Inner Mongolia Autonomous Region'],[2350,'Mongolian']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Halloween','Mongolian']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='Carla')?.meaning).toContain('人名');
 expect(catalog.entries.find(e=>e.headword==='La Tomatina')?.meaning).toContain('番茄');
});
