import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 1 reflect vocabulary with corrected meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2295,'take advantage of'],[2296,'media'],[2297,'the media'],[2298,'reflect'],[2299,'belief'],[2300,'faith'],[2301,'occasion'],[2302,'have sth. in common'],[2303,'atmosphere'],[2304,'lunar']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['media','reflect','belief','occasion','atmosphere','lunar'])expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='have sth. in common')?.meaning).toBe('phr. 有共同之处');
 expect(catalog.entries.find(e=>e.headword==='take advantage of')?.meaning).toContain('利用');
});
