import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides sound spelling with the relevant sense and pronunciation distinctions',()=>{
 for(const word of ['determination','advocate','buffet','conflict']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(getSoundSpellingLesson('determination')?.chunks.find(c=>c.stress==='primary')?.letters).toBe('na');
 for(const word of ['advocate','buffet','conflict']) expect(getSoundSpellingLesson(word)?.variantNote).toMatch(/名词.*动词|动词.*名词/);
});
