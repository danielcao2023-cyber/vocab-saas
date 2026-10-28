import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 prevention vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1926,'protest'],[1927,'turn to'],[1928,'committee'],[1929,'establish'],[1930,'limit'],[1931,'prevent']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['protest','committee','establish','limit','prevent']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(getSoundSpellingLesson('protest')?.variantNote).toContain('/prəˈtest/');
});
