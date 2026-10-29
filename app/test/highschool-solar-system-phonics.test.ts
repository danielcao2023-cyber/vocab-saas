import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the Oxford pronunciation of solar system',()=>{
 const lesson=getSoundSpellingLesson('solar system');expect(lesson?.ipa).toBe('/ˈsəʊlə sɪstəm/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('solar system');
 expect(lesson?.sources.some(s=>s.url==='https://www.oxfordlearnersdictionaries.com/us/definition/english/solar-system')).toBe(true);
});
