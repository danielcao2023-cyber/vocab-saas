import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Masaccio with documented US and UK pronunciations',()=>{
 const l=getSoundSpellingLesson('Masaccio');expect(l?.ipa).toBe('/məˈsɑːtʃioʊ/');expect(l?.uk).toBe('/məˈzɑːtʃəʊ/');
 expect(l?.chunks.map(c=>c.letters).join('')).toBe('Masaccio');expect(l?.chunks.find(c=>c.stress==='primary')?.letters).toBe('sa');
 expect(l?.sources.some(s=>s.url==='https://dictionary.cambridge.org/pronunciation/english/masaccio')).toBe(true);
});
