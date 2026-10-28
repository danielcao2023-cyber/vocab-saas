import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 2 Unit 1 evidence vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[3061,'subscribe'],[3062,'subscribe to'],[3063,'proof'],[3064,'multiple'],[3065,'pump'],[3066,'water pump'],[3067,'household'],[3068,'suspect'],[3069,'blame'],[3070,'handle'],[3071,'intervention'],[3072,'link'],[3073,'raw'],[3074,'pure'],[3075,'substantial']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['subscribe','multiple','household','suspect','handle','intervention','substantial']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
