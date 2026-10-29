import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it('loads the sourced Robert Louis Stevenson full name and stress',()=>{
 const found=getSoundSpellingLessons('Robert Louis Stevenson');expect(found).toHaveLength(1);const l=found[0];expect(l.ipa).toBe('/ˌrɑːbərt ˌluːɪs ˈstiːvnsən/');expect(l.uk).toBe('/ˌrɒbət ˌluːɪs ˈstiːvnsən/');expect(l.chunks.map(c=>c.letters).join('')).toBe(l.headword);expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['Ste']);expect(l.chunks.filter(c=>c.stress==='secondary').map(c=>c.letters)).toEqual(['Ro','Lou']);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
