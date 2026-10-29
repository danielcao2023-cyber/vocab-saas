import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Oxford pronunciations for first aid and the upper class',()=>{
 for(const [word,ipa] of [['first aid','/ˌfɜːst ˈeɪd/'],['the upper class','/ði ˌʌpə ˈklɑːs/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
