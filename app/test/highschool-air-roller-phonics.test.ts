import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Oxford pronunciations for air conditioner and roller coaster',()=>{
 for(const [word,ipa] of [['air conditioner','/ˈeə kəndɪʃənə/'],['roller coaster','/ˈrəʊlə kəʊstə/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
