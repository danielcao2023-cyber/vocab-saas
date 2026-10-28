import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 safety vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1803,'destroy'],[1804,'evacuate'],[1805,'helicopter'],[1806,'affect'],[1807,'shelter'],[1808,'crack']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['destroy','evacuate','helicopter','affect','shelter','crack']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
