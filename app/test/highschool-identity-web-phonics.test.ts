import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps complete Oxford pronunciations for identity card and the World Wide Web',()=>{
 for(const [word,ipa] of [['identity card','/aɪˈdentəti kɑːd/'],['the World Wide Web','/ðə ˌwɜːld waɪd ˈweb/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
