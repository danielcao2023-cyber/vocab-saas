import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 3 online-safety vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2097,'troll'],[2098,'cyberbully'],[2099,'particular'],[2100,'embarrassing'],[2101,'make fun of'],[2102,'upset'],[2103,'guideline'],[2104,'author'],[2105,'tip'],[2106,'keep in mind'],[2107,'keep ... in mind'],[2108,'define']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['cyberbully','particular','embarrassing','upset','guideline','author','define']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
