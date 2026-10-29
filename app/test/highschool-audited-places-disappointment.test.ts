import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
it.each([['Birmingham','/ˈbɜːmɪŋəm/'],['Switzerland','/ˈswɪtsɚlənd/'],['disappointment','/ˌdɪsəˈpɔɪntmənt/']] as const)('%s is available with the checked pronunciation', (word,ipa)=>{
 const lessons=getSoundSpellingLessons(word); expect(lessons).toHaveLength(1); const l=lessons[0];expect(l.ipa).toBe(ipa);expect(l.chunks.map(c=>c.letters).join('')).toBe(word);for(const c of l.chunks)expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(l.chunks.filter(c=>c.stress==='primary')).toHaveLength(1);
});
it('uses the UK Birmingham city spelling-to-sound mapping',()=>{const l=getSoundSpellingLessons('Birmingham')[0];expect(l.chunks.find(c=>c.letters==='ham')?.pairs.find(p=>p.letters==='h')?.sound).toBe('');expect(l.variantNote).toContain('英国');});
