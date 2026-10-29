import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Oxford pronunciations for comfort zone and junk food',()=>{
 for(const [word,ipa] of [['comfort zone','/ˈkʌmfət zəʊn/'],['junk food','/ˈdʒʌŋk fuːd/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
