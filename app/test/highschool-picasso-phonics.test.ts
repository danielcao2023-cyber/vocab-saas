import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Picasso and distinguishes the documented US and UK vowels',()=>{
 const l=getSoundSpellingLesson('Picasso');
 expect(l?.ipa).toBe('/pɪˈkɑːsoʊ/');expect(l?.uk).toBe('/pɪˈkæsəʊ/');
 expect(l?.chunks.map(c=>c.letters).join('')).toBe('Picasso');
 expect(l?.chunks.find(c=>c.stress==='primary')?.letters).toBe('ca');
 expect(l?.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='ss')?.sound).toBe('/s/');
 expect(l?.sources.some(s=>s.url==='https://dictionary.cambridge.org/pronunciation/english/picasso')).toBe(true);
});
