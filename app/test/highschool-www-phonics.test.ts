import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps WWW to the Oxford letter-name pronunciation',()=>{
 const lesson=getSoundSpellingLesson('WWW');expect(lesson?.ipa).toBe('/ˌdʌbljuː dʌbljuː ˈdʌbljuː/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('WWW');
 expect(lesson?.sources.some(s=>s.url==='https://www.oxfordlearnersdictionaries.com/definition/english/www')).toBe(true);
});
