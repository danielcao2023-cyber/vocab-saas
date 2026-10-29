import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it('loads the sourced complete name and stress',()=>{
 const word='Elizabeth Barrett Browning';const found=getSoundSpellingLessons(word);expect(found).toHaveLength(1);const l=found[0];expect(l.ipa).toBe('/ɪˌlɪzəbəθ ˌbærət ˈbraʊnɪŋ/');expect(l.chunks.map(c=>c.letters).join('')).toBe(word);expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['Brow']);expect(l.chunks.filter(c=>c.stress==='secondary').map(c=>c.letters)).toEqual(['li','Ba']);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
