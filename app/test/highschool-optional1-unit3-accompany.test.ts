import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 3 accompanying vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2851,'accompany'],[2852,'adopt'],[2853,'sour'],[2854,'set out'],[2855,'bless'],[2856,'live off'],[2857,'prohibition'],[2858,'prohibit'],[2859,'journalist'],[2860,'sneeze'],[2861,'teapot'],[2862,'label'],[2863,'cream'],[2864,'leopard'],[2865,'stretch']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['accompany','adopt','prohibition','prohibit','journalist','teapot','label','leopard']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
