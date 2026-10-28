import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 5 original vocabulary and sound mappings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2203,'original'],[2204,'phenomenon'],[2205,'altogether'],[2206,'thus'],[2207,'rap'],[2208,'nowadays'],[2209,'gradual'],[2210,'capable'],[2211,'relief'],[2212,'cure']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['original','phenomenon','altogether','nowadays','gradual','capable','relief']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
