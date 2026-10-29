import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the English pronunciation of Michelangelo and its stresses',()=>{
 const l=getSoundSpellingLesson('Michelangelo');
 expect(l?.ipa).toBe('/ˌmaɪkəlˈændʒəloʊ/');
 expect(l?.chunks.map(c=>c.letters).join('')).toBe('Michelangelo');
 expect(l?.chunks.find(c=>c.stress==='secondary')?.letters).toBe('Mi');
 expect(l?.chunks.find(c=>c.stress==='primary')?.letters).toBe('an');
 expect(l?.sources.some(s=>s.url==='https://dictionary.cambridge.org/pronunciation/english/michelangelo')).toBe(true);
});
