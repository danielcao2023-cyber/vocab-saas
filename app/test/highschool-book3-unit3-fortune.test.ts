import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 3 fortune vocabulary and corrects china',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2461,"seek one's fortune"],[2462,'earn'],[2463,'earn a living'],[2464,'immigrant'],[2465,'select'],[2466,'china'],[2467,'jazz'],[2468,'bar'],[2469,'diagram'],[2470,'journal']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['immigrant','select','china','diagram','journal']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='china')?.meaning).toContain('瓷器');
});
