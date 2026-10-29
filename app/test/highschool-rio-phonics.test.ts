import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it('loads the sourced Rio city pronunciation and mapping',()=>{
 const found=getSoundSpellingLessons('Rio');expect(found).toHaveLength(1);const l=found[0];expect(l.ipa).toBe('/ˈriːoʊ/');expect(l.uk).toBe('/ˈriːəʊ/');expect(l.chunks.map(c=>c.letters).join('')).toBe('Rio');expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['Ri']);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
