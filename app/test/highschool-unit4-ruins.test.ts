import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 ruins vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1809,'as if'],[1810,'ruin'],[1811,'in ruins'],[1812,'percent'],[1813,'brick'],[1814,'metal']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['ruin','percent','brick','metal']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
