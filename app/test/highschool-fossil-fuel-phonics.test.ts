import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the sourced fossil fuel pronunciation with both stresses',()=>{
 const lesson=getSoundSpellingLesson('fossil fuel');
 expect(lesson?.ipa).toBe('/ˈfɒsəl ˌfjʊəl/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('fossil fuel');
 expect(lesson?.chunks.find(c=>c.stress==='primary')?.letters).toBe('foss');
 expect(lesson?.chunks.find(c=>c.stress==='secondary')?.letters).toBe('fu');
 expect(lesson?.sources.some(s=>s.url==='https://dictionary.cambridge.org/pronunciation/english/fossil-fuel')).toBe(true);
});
