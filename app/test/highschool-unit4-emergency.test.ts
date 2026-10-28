import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 emergency vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1833,'kit'],[1834,'first aid kit'],[1835,'on hand'],[1836,'crash'],[1837,'swept'],[1838,'sweep away']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['kit','crash','swept']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
