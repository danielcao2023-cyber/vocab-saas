import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 weather vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1791,'tornado'],[1792,'tornadoes'],[1793,'tornados'],[1794,'drought'],[1795,'landslide'],[1796,'landfall']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['tornado','tornadoes','tornados','drought','landslide','landfall']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
