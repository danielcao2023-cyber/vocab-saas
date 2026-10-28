import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 5 music vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2183,'classical'],[2184,'hip-hop'],[2185,'techno'],[2186,'soul'],[2187,'bagpipes'],[2188,'stringed'],[2189,'stringed instrument'],[2190,'virtual'],[2191,'virtual choir'],[2192,'composition']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['classical','techno','bagpipes','virtual','composition']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
