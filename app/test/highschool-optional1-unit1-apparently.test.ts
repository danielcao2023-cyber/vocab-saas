import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides optional Book 1 Unit 1 apparently vocabulary and corrects wear and tear meaning',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2709,'apparently'],[2710,'substance'],[2711,'insist'],[2712,'insist on'],[2713,'scientific'],[2714,'mostly'],[2715,'wear and tear'],[2716,'conclusion'],[2717,'penicillin'],[2718,'flee'],[2719,'circumstance'],[2720,'novelist'],[2721,'flow'],[2722,'chart'],[2723,'flow chart'],[2724,'infer']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['apparently','substance','insist','scientific','mostly','conclusion','penicillin','circumstance','novelist','infer']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='wear and tear')).toMatchObject({meaning:'n. 正常使用造成的磨损',meaningCorrection:{expected:'na. 磨损；衰竭；伐采'}});
});
