import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 4 kingdom vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2121,'kingdom'],[2122,'chief'],[2123,'puzzle'],[2124,'nearby'],[2125,'join ... to ...'],[2126,'break away'],[2127,'break away from sb.'],[2128,'break away from sth.'],[2129,'belong to'],[2130,'as well as'],[2131,'currency'],[2132,'military']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['kingdom','puzzle','nearby','currency','military']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
