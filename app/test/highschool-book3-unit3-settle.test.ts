import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 3 settlement vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2491,'mild'],[2492,'settle'],[2493,'construction'],[2494,'to name but a few'],[2495,'tai chi'],[2496,'clothing'],[2497,'herbal'],[2498,'first hand'],[2499,'at first hand'],[2500,'item']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['settle','construction','clothing','herbal','item']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
