import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 2 sacred vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2025,'sacred'],[2026,'shot'],[2027,'profit'],[2028,'watch over'],[2029,'day and night'],[2030,'effective'],[2031,'recover'],[2032,'remove'],[2033,'intend'],[2034,'threat']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['sacred','shot','profit','effective','recover','remove','intend','threat']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
