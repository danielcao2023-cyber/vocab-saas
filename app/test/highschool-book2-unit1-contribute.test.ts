import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 contribution vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1932,'prevent ... from'],[1933,'contribution'],[1934,'contribute'],[1935,'department'],[1936,'fund'],[1937,'investigate']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['contribution','contribute','department','fund','investigate']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
