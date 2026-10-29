import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps complete track and field and junior high school pronunciations',()=>{
 for(const [word,ipa] of [['track and field','/ˌtræk ən ˈfiːld/'],['junior high school','/ˌdʒuːniə ˈhaɪ skuːl/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
