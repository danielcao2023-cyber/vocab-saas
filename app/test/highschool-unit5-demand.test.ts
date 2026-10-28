import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 communication vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1897,'gap'],[1898,'demand'],[1899,'vocabulary'],[1900,'description'],[1901,'relate'],[1902,'relate to']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['gap','demand','vocabulary','description','relate']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
