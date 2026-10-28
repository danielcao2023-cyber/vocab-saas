import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 2 replacement vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2394,'replace'],[2395,'operation'],[2396,'whisper'],[2397,'midnight'],[2398,'import'],[2399,'export'],[2400,'pole'],[2401,'lap']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['replace','operation','whisper','midnight','import','export']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
