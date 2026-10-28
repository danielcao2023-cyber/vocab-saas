import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 3 comparison vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1787,'now and then'],[1788,'compare ... with ...'],[1789,'compare ... to ...'],[1790,'error']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 expect(getSoundSpellingLesson('error')).toBeDefined();
});
