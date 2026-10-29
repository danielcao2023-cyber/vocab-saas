import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Raphael using a sourced British pronunciation of the painter',()=>{
 const l=getSoundSpellingLesson('Raphael');
 expect(l?.ipa).toBe('/ˈræfeɪəl/');
 expect(l?.chunks.map(c=>c.letters).join('')).toBe('Raphael');
 expect(l?.chunks.find(c=>c.stress==='primary')?.letters).toBe('Raph');
 expect(l?.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='ph')?.sound).toBe('/f/');
 expect(l?.variantNote).toMatch(/录音/);
 expect(l?.sources.some(s=>s.url==='https://www.collinsdictionary.com/dictionary/english/raphael')).toBe(true);
});
