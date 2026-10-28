import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 recovery vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1815,'in shock'],[1816,'electricity'],[1817,'trap'],[1818,'bury'],[1819,'breathe'],[1820,'revive']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['electricity','trap','bury','breathe','revive']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
