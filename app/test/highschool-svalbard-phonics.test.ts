import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Svalbard to a sourced British pronunciation and mentions variant final d',()=>{
 const lesson=getSoundSpellingLesson('Svalbard');
 expect(lesson?.ipa).toBe('/ˈsvælbɑːd/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Svalbard');
 expect(lesson?.chunks.find(c=>c.stress==='primary')?.letters).toBe('Sval');
 expect(lesson?.variantNote).toMatch(/不发|省略/);
 expect(lesson?.sources.some(s=>s.url==='https://en.wiktionary.org/wiki/Svalbard#English')).toBe(true);
});
