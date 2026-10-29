import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it.each([['Fred Hoyle','/ˌfred ˈhɔɪl/'],['Isaac Asimov','/ˌaɪzək ˈæzɪmɑːf/']] as const)('%s loads the sourced full name',(word,ipa)=>{
 const found=getSoundSpellingLessons(word);expect(found).toHaveLength(1);const l=found[0];expect(l.ipa).toBe(ipa);expect(l.chunks.map(c=>c.letters).join('')).toBe(word);expect(l.chunks.filter(c=>c.stress==='primary')).toHaveLength(1);expect(l.chunks.filter(c=>c.stress==='secondary')).toHaveLength(1);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
