import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 global vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1879,'means'],[1880,'regard'],[1881,'calligraphy'],[1882,'global'],[1883,'affair'],[1884,'appreciate']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['means','regard','calligraphy','global','affair','appreciate']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
