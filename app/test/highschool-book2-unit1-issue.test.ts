import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 issue vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1938,'issue'],[1939,'conduct'],[1940,'document'],[1941,'donate ... to ...'],[1942,'disappear'],[1943,'attempt']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['issue','conduct','document','disappear','attempt']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
