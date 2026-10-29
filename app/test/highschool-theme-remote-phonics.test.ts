import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Oxford pronunciations for theme park and remote control',()=>{
 for(const [word,ipa] of [['theme park','/ˈθiːm pɑːk/'],['remote control','/rɪˌməʊt kənˈtrəʊl/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
