import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps complete Oxford pronunciations for the North and South Pole',()=>{
 for(const [word,ipa] of [['the North Pole','/ðə ˌnɔːθ ˈpəʊl/'],['the South Pole','/ðə ˌsaʊθ ˈpəʊl/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
