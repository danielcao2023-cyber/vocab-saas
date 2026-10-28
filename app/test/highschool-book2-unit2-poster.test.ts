import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 2 poster vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1985,'poster'],[1986,'illegal'],[1987,'illegally'],[1988,'hunter'],[1989,'immediately'],[1990,'species'],[1991,'fin'],[1992,'on earth'],[1993,'die out'],[1994,'alarming']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['poster','illegal','illegally','hunter','immediately','species','fin','alarming']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
