import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 disaster and rescue vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1797,'slide'],[1798,'tsunami'],[1799,'volcanic eruption'],[1800,'magnitude'],[1801,'rescue'],[1802,'damage']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['slide','tsunami','magnitude','rescue','damage']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
