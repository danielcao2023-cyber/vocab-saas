import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 5 narrator vocabulary and corrects imported meanings and pronunciation',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2622,'narrator'],[2623,'narration'],[2624,'bet'],[2625,'make a bet'],[2626,'servant'],[2627,'as a matter of fact'],[2628,'by accident'],[2629,'sail'],[2630,'spot'],[2631,'consulate'],[2632,'dare'],[2633,'sort'],[2634,'mining'],[2635,'patience']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['narrator','narration','servant','consulate','mining','patience']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='narration')).toMatchObject({phoneticCorrection:{expected:'[nəˈreɪʃnˌnæˈreɪʃn]'}});
 expect(catalog.entries.find(e=>e.headword==='consulate')?.meaning).toBe('n. 领事馆；领事机构');
});
