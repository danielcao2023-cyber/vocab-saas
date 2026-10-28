import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 revival vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1821,'revival'],[1822,'unify'],[1823,'wisdom'],[1824,'context'],[1825,'volcano'],[1826,'erupt']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['revival','unify','wisdom','context','volcano','erupt']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
