import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 system vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1861,'system'],[1862,'despite'],[1863,'ups and downs'],[1864,'factor'],[1865,'based'],[1866,'base']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['system','despite','factor','based','base']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
