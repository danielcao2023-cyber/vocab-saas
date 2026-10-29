import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it('matches the sourced pronunciation and spelling mapping for module',()=>{
 const found=getSoundSpellingLessons('module');expect(found).toHaveLength(1);const l=found[0];expect(l.headword).toBe('module');expect(l.ipa).toBe('/ˈmɑːdʒuːl/');expect(l.uk).toBe('/ˈmɒdʒuːl/');expect(l.chunks.map(c=>c.letters).join('')).toBe(l.headword);expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['mo']);
 for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
