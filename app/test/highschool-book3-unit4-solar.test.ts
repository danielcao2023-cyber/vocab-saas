import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 solar vocabulary and corrects microwave',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2557,'otherwise'],[2558,'beyond'],[2559,'solar'],[2560,'solar system'],[2561,'current'],[2562,'figure out'],[2563,'sufficient'],[2564,'soap'],[2565,'towel'],[2566,'microwave']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['otherwise','beyond','solar','current','sufficient','towel','microwave']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='microwave')?.meaning).toContain('微波炉');
});
