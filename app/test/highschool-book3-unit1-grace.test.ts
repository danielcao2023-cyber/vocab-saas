import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 1 grace vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2332,'grace'],[2333,'absolutely'],[2334,'brief'],[2335,'branch'],[2336,'wedding'],[2337,'clap'],[2338,'horrible']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['absolutely','wedding','horrible']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
