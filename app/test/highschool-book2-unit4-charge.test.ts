import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 4 charge vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2145,'charge'],[2146,'announce'],[2147,'amount'],[2148,'gallery'],[2149,'approach'],[2150,'ensure'],[2151,'generous'],[2152,'ancestor'],[2153,'courtyard'],[2154,'eager'],[2155,'county'],[2156,'feast']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['announce','amount','gallery','approach','ensure','generous','ancestor','courtyard','eager','county']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
