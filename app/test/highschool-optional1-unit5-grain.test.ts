import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 5 grain vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[3001,'comprise'],[3002,'be comprised of'],[3003,'generate'],[3004,'strain'],[3005,'leisure'],[3006,'deep down'],[3007,'celebrity'],[3008,'envision'],[3009,'sorghum'],[3010,'broom'],[3011,'grain'],[3012,'vision'],[3013,'reality'],[3014,'salty'],[3015,'urban']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['comprise','generate','leisure','celebrity','envision','sorghum','vision','reality','salty','urban']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
