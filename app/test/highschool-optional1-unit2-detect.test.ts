import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 2 safety vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2786,'obey'],[2787,'warning'],[2788,'constant'],[2789,'early on'],[2790,'abnormal'],[2791,'critical'],[2792,'potentially'],[2793,'potential'],[2794,'leak'],[2795,'electrical'],[2796,'wiring'],[2797,'wire'],[2798,'detect']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['obey','warning','constant','abnormal','critical','potentially','potential','electrical','wiring','detect']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
