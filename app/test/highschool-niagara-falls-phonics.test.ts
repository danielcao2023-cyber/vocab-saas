import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the documented Niagara Falls pronunciation and notes variants',()=>{
 const lesson=getSoundSpellingLesson('Niagara Falls');
 expect(lesson?.ipa).toBe('/naɪˈæɡɹə fɔlz/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Niagara Falls');
 expect(lesson?.chunks.find(c=>c.stress==='primary')?.letters).toBe('aga');
 expect(lesson?.variantNote).toMatch(/弱读/);
 expect(lesson?.sources.some(s=>s.url==='https://en.wiktionary.org/wiki/Niagara_Falls#English')).toBe(true);
});
