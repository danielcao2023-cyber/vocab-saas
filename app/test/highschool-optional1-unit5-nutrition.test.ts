import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 5 nutrition vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[3016,'bomb'],[3017,'tunnel'],[3018,'extension'],[3019,'chemical'],[3020,'wheat'],[3021,'flavour'],[3022,'flavor'],[3023,'fertiliser'],[3024,'fertilizer'],[3025,'nutritional'],[3026,'nutritious'],[3027,'nutrition'],[3028,'alleviate'],[3029,'poverty'],[3030,'organic']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['tunnel','chemical','flavour','flavor','fertiliser','fertilizer','nutritional','nutritious','nutrition','alleviate','poverty','organic']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
