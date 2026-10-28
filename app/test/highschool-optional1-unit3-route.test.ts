import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 3 route and park vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2866,'rewarding'],[2867,'bush'],[2868,'lung'],[2869,'cycle'],[2870,'corridor'],[2871,'pedal'],[2872,'fountain'],[2873,'route'],[2874,'theme'],[2875,'theme park'],[2876,'roller coaster'],[2877,'incredible'],[2878,'appeal'],[2879,'appeal to'],[2880,'pirate']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['rewarding','cycle','corridor','pedal','fountain','incredible','appeal','pirate']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
