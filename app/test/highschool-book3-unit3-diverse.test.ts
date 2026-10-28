import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 3 diversity vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2441,'diverse'],[2442,'diversity'],[2443,'fortune'],[2444,'fortune cookie'],[2445,'gumbo'],[2446,'nachos'],[2447,'spicy'],[2448,'ethnic'],[2449,'admit'],[2450,'definitely']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['diverse','diversity','fortune','gumbo','nachos','spicy','ethnic','admit','definitely']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
