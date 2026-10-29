import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the complete Oxford pronunciation of The Middle Ages',()=>{
 const lesson=getSoundSpellingLesson('The Middle Ages');
 expect(lesson?.ipa).toBe('/ðə ˌmɪdl ˈeɪdʒɪz/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('The Middle Ages');
 expect(lesson?.chunks.filter(c=>c.stress==='secondary')).toHaveLength(1);
 expect(lesson?.sources.some(s=>s.url==='https://www.oxfordlearnersdictionaries.com/definition/english/the-middle-ages')).toBe(true);
});
