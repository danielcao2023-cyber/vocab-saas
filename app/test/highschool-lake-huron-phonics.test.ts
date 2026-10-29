import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the sourced Lake Huron pronunciation with phrase stresses',()=>{
 const lesson=getSoundSpellingLesson('Lake Huron');
 expect(lesson?.ipa).toBe('/ˌleɪk ˈhjʊrɑːn/');
 expect(lesson?.uk).toBe('/ˌleɪk ˈhjʊərən/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Lake Huron');
 expect(lesson?.chunks.find(c=>c.stress==='secondary')?.letters).toBe('Lake ');
 expect(lesson?.chunks.find(c=>c.stress==='primary')?.letters).toBe('Hu');
 expect(lesson?.sources.some(s=>s.url==='https://dictionary.cambridge.org/dictionary/english/lake-huron')).toBe(true);
});
