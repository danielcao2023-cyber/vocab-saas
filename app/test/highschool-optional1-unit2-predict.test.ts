import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 2 prediction vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2811,'artificial intelligence'],[2812,'clone'],[2813,'predict'],[2814,'prediction'],[2815,'forecast'],[2816,'occupation'],[2817,'oppose'],[2818,'hence'],[2819,'cease'],[2820,'deceased'],[2821,'absence'],[2822,'rural'],[2823,'advocate']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['predict','prediction','forecast','occupation','oppose','deceased','absence','rural']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
