import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it('loads the sourced full Arctic Circle name and stress',()=>{
 const word='the Arctic Circle';const found=getSoundSpellingLessons(word);expect(found).toHaveLength(1);const l=found[0];expect(l.ipa).toBe('/ði ˌɑːrktɪk ˈsɜːrkl/');expect(l.uk).toBe('/ði ˌɑːktɪk ˈsɜːkl/');expect(l.chunks.map(c=>c.letters).join('')).toBe(word);expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['Cir']);expect(l.chunks.filter(c=>c.stress==='secondary').map(c=>c.letters)).toEqual(['Arc']);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
