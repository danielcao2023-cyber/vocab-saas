import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 docking vocabulary and corrects meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2547,'spacewalk'],[2548,'jade'],[2549,'dock'],[2550,'signal'],[2551,'in the hope of doing sth.'],[2552,'so as to'],[2553,'so as to do sth.'],[2554,'muscle'],[2555,'lack'],[2556,'float']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['spacewalk','signal','muscle']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='dock')?.meaning).toContain('对接');
 expect(catalog.entries.find(e=>e.headword==='in the hope of doing sth.')?.meaning).toContain('希望');
});
