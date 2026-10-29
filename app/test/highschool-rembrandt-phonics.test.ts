import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Rembrandt to the documented English pronunciation',()=>{
 const l=getSoundSpellingLesson('Rembrandt');expect(l?.ipa).toBe('/ˈrɛmbrænt/');
 expect(l?.chunks.map(c=>c.letters).join('')).toBe('Rembrandt');
 expect(l?.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='dt')?.sound).toBe('/t/');
 expect(l?.sources.some(s=>s.url==='https://www.collinsdictionary.com/dictionary/english/rembrandt')).toBe(true);
});
