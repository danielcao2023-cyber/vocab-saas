import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it('loads Alexander Fleming with the sourced full-name stress and mapping',()=>{
 const found=getSoundSpellingLessons('Alexander Fleming');expect(found).toHaveLength(1);const l=found[0];expect(l.ipa).toBe('/ˌælɪɡzændər ˈflemɪŋ/');expect(l.uk).toBe('/ˌælɪɡzɑːndə ˈflemɪŋ/');expect(l.chunks.map(c=>c.letters).join('')).toBe(l.headword);expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['Flem']);expect(l.chunks.filter(c=>c.stress==='secondary').map(c=>c.letters)).toEqual(['Al']);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
