import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Welcome Unit formal vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1611,'formal'],[1612,'anxious'],[1613,'annoyed'],[1614,'annoy'],[1615,'frightened'],[1616,'senior'],[1617,'senior high school'],[1618,'at last'],[1619,'outgoing'],[1620,'impression']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['formal','anxious','annoyed','annoy','frightened','senior','outgoing','impression']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
