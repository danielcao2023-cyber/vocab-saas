import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 resource vocabulary and corrects provide for someone',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2587,'resource'],[2588,'limited'],[2589,'provide for sb.'],[2590,'closing'],[2591,'in closing'],[2592,'mystery'],[2593,'run out'],[2594,'attach'],[2595,'oxygen']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['resource','limited','closing','mystery','attach','oxygen']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='provide for sb.')).toMatchObject({meaning:'phr. v. 供养某人；为某人提供生活所需',meaningCorrection:{expected:'v. 为…作准备'}});
});
