import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('distinguishes the complex spelling illustration from the sourced recording pronunciation',()=>{
 const lesson=getSoundSpellingLesson('complex');
 expect(lesson?.ipa).toBe('/kɑːmˈpleks/');
 expect(lesson?.variantNote).toContain('/kəmˈpleks/');
 expect(lesson?.variantNote).toContain('发音变体');
 expect(lesson?.variantNote).not.toContain('录音');
 expect(lesson?.variantNote).not.toContain('试听');
 expect(lesson?.sources.some(s=>s.url==='https://en.wiktionary.org/wiki/complex#English')).toBe(true);
});
