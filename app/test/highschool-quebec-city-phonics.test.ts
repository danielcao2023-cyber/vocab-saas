import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Quebec City with both word stresses and Canadian variants',()=>{
 const lesson=getSoundSpellingLesson('Quebec City');
 expect(lesson?.ipa).toBe('/kəˈbɛk ˈsɪti/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Quebec City');
 expect(lesson?.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['bec ','Ci']);
 expect(lesson?.variantNote).toContain('/kwɪˈbɛk/');
 expect(lesson?.sources.some(s=>s.url==='https://en.wiktionary.org/wiki/Quebec_City#English')).toBe(true);
});
