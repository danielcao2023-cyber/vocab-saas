import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 3 mushroom vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2481,'boot'],[2482,'mushroom'],[2483,'poisonous'],[2484,'poison'],[2485,'fold'],[2486,'super'],[2487,'collection'],[2488,'accessory'],[2489,'souvenir'],[2490,'percentage']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['mushroom','poisonous','poison','super','collection','accessory','souvenir','percentage']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
