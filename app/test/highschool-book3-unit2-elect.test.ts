import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 2 elect vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2378,'faraway'],[2379,'elect'],[2380,'election'],[2381,'decade'],[2382,'elsewhere'],[2383,'tend'],[2384,'tend to do sth.'],[2385,'staff']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['faraway','elect','election','decade','elsewhere']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
