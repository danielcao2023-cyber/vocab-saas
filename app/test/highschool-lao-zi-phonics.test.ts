import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('shows Lao Zi with the explicitly sourced British reading and variant warning',()=>{
 const lesson=getSoundSpellingLesson('Lao Zi');
 expect(lesson?.ipa).toBe('/ˈlaʊ ˈzɪə/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Lao Zi');
 expect(lesson?.chunks.filter(c=>c.stress==='primary')).toHaveLength(2);
 expect(lesson?.variantNote).toMatch(/拼音/);
 expect(lesson?.sources.some(s=>s.url==='https://www.collinsdictionary.com/us/dictionary/english/lao-zi')).toBe(true);
});
