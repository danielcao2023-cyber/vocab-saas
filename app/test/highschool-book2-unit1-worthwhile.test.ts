import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 worthwhile vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1944,'make sure'],[1945,'worthwhile'],[1946,'republic'],[1947,'professional'],[1948,'archaeologist'],[1949,'entrance'],[1950,'pyramid'],[1951,'process']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['worthwhile','republic','professional','archaeologist','entrance','pyramid','process']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
