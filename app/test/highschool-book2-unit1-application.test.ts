import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 application vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1914,'clue'],[1915,'preserve'],[1916,'promote'],[1917,'cypress'],[1918,'application'],[1919,'take part in']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['clue','preserve','promote','cypress','application']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
