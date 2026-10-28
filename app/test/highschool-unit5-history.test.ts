import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 history vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1867,'date back'],[1868,'date back to ...'],[1869,'bone'],[1870,'shell'],[1871,'carve'],[1872,'dynasty']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['bone','shell','carve','dynasty']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
