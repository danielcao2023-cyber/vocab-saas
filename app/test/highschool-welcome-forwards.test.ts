import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Welcome Unit forwards vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1632,'forwards'],[1633,'look forward to'],[1634,'take notes'],[1635,'flash'],[1636,'flash card'],[1637,'organize'],[1638,'organisation'],[1639,'organization'],[1640,'strategy'],[1641,'personality'],[1642,'revise']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['forwards','flash','organize','organisation','organization','strategy','personality','revise']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
