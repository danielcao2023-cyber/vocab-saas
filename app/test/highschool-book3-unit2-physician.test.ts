import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 2 physician vocabulary and corrects the resident meaning',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2368,'union'],[2369,'scholarship'],[2370,'hire'],[2371,'physician'],[2372,'resident physician'],[2373,'colleague'],[2374,'reject'],[2375,'rejection'],[2376,'appoint'],[2377,'clinic']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['union','scholarship','physician','colleague','reject','rejection','appoint','clinic']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='resident physician')?.meaning).toBe('n. 住院医师');
});
