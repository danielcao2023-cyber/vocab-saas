import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 2 rate vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1995,'rate'],[1996,'rating'],[1997,'extinct'],[1998,'extinction'],[1999,'mass'],[2000,'habitat'],[2001,'aware of'],[2002,'endanger'],[2003,'on average'],[2004,'make progress']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['rate','rating','extinct','extinction','mass','habitat','endanger']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
