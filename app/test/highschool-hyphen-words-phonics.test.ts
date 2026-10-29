import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
it('serves complete original spelling, mapped letters and dictionary pronunciation for hyphenated textbook words',()=>{
 for(const [word,ipa] of [['high-end','/ˌhaɪˈend/'],['make-up','/ˈmeɪk.ʌp/'],['upper-class','/ˌʌpə ˈklɑːs/']]){
  const lesson=getSoundSpellingLessons(word).find(l=>l.headword===word);expect(lesson,word).toBeDefined();expect(lesson!.uk).toBe(ipa);expect(lesson!.chunks.map(c=>c.letters).join('')).toBe(word);expect(lesson!.chunks.flatMap(c=>c.pairs).map(p=>p.letters).join('')).toBe(word);expect(lesson!.sources.length).toBeGreaterThan(0);
 }
});
