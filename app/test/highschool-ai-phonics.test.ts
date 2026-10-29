import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the Oxford pronunciation of artificial intelligence',()=>{
 const lesson=getSoundSpellingLesson('artificial intelligence');expect(lesson?.ipa).toBe('/ˌɑːtɪfɪʃl ɪnˈtelɪdʒəns/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('artificial intelligence');
 expect(lesson?.sources.some(s=>s.url.includes('oxfordlearnersdictionaries.com'))).toBe(true);
});
