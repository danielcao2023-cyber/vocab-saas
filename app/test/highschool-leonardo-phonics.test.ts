import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('shows the sourced British reading of the complete Leonardo da Vinci name',()=>{
 const lesson=getSoundSpellingLesson('Leonardo da Vinci');
 expect(lesson?.ipa).toBe('/ˌliːəˈnɑːdəʊ də ˈvɪntʃɪ/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Leonardo da Vinci');
 expect(lesson?.variantNote).toMatch(/意大利语/);
 expect(lesson?.sources.some(s=>s.url==='https://www.collinsdictionary.com/dictionary/english/leonardo-da-vinci')).toBe(true);
});
