import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it.each([['Tagore','/təˈɡɔːr/'],['Hitler','/ˈhɪtlɚ/']] as const)('%s is available with sourced spelling alignment',(word,ipa)=>{
 const matches=getSoundSpellingLessons(word);expect(matches).toHaveLength(1);const l=matches[0];expect(l.ipa).toBe(ipa);expect(l.chunks.map(c=>c.letters).join('')).toBe(word);expect(l.chunks.filter(c=>c.stress==='primary')).toHaveLength(1);for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
});
