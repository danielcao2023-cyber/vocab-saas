import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 transmission vocabulary and corrects carry on',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2537,'transmit'],[2538,'data'],[2539,'disappointed'],[2540,'desire'],[2541,'carry on'],[2542,'ongoing'],[2543,'on board'],[2544,'independently'],[2545,'independent'],[2546,'spacecraft']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['transmit','data','disappointed','desire','ongoing','independently','independent','spacecraft']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='carry on')?.meaning).toContain('继续');
});
