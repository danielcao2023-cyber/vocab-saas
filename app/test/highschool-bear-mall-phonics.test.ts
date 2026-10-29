import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Oxford pronunciations for grizzly bear and shopping mall',()=>{
 for(const [word,ipa] of [['grizzly bear','/ˌɡrɪzli ˈbeə/'],['shopping mall','/ˈʃɒpɪŋ mɔːl/']]){
  const lesson=getSoundSpellingLesson(word);expect(lesson?.ipa).toBe(ipa);expect(lesson?.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
 }
});
