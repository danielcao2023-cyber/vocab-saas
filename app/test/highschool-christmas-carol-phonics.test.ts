import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the complete Oxford pronunciation of Christmas carol',()=>{
 const lesson=getSoundSpellingLesson('Christmas carol');expect(lesson?.ipa).toBe('/ˌkrɪsməs ˈkærəl/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Christmas carol');
 expect(lesson?.sources.some(s=>s.url==='https://www.oxfordlearnersdictionaries.com/definition/english/christmas-carol')).toBe(true);
});
