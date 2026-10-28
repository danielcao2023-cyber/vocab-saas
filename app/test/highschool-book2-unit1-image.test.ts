import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 image vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1961,'image'],[1962,'cave'],[1963,'throughout'],[1964,'all over the world'],[1965,'further'],[1966,'historic'],[1967,'quote'],[1968,'paraphrase'],[1969,'comparison'],[1970,'contrast'],[1971,'identify']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['image','cave','throughout','further','historic','quote','paraphrase','comparison','contrast','identify']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
