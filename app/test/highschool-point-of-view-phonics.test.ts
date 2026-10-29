import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the Oxford pronunciation of point of view',()=>{
 const lesson=getSoundSpellingLesson('point of view');
 expect(lesson?.ipa).toBe('/ˌpɔɪnt əv ˈvjuː/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('point of view');
 expect(lesson?.sources.some(s=>s.url==='https://www.oxfordlearnersdictionaries.com/us/definition/english/point-of-view')).toBe(true);
});
