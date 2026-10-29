import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('documents both Oxford and Cambridge occupy vowel conventions without changing the existing alignment',()=>{const l=getSoundSpellingLesson('occupy')!;expect(l.ipa).toBe('/ˈɑːkjupaɪ/');expect(l.uk).toBe('/ˈɒkjupaɪ/');expect(l.variantNote).toContain('/jə/');expect(l.sources.some(x=>x.url.includes('oxfordlearnersdictionaries.com/definition/english/occupy'))).toBe(true);expect(l.chunks.flatMap(c=>c.pairs).some(p=>p.letters==='cc'&&p.sound==='/k/')).toBe(true);});
