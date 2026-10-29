import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it('loads the checked Cusco spelling and pronunciation',()=>{
 const found=getSoundSpellingLessons('Cusco');expect(found).toHaveLength(1);const l=found[0];expect(l.ipa).toBe('/ˈkuːskoʊ/');expect(l.uk).toBe('/ˈkuːskəʊ/');expect(l.chunks.map(c=>c.letters).join('')).toBe('Cusco');expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['Cu']);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
