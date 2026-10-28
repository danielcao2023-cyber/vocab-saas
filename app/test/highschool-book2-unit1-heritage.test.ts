import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 heritage vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1908,'heritage'],[1909,'creatively'],[1910,'temple'],[1911,'relic'],[1912,'mount'],[1913,'former']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['heritage','creatively','temple','relic','mount','former']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
