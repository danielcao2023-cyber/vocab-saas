import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Renoir with the documented US and UK pronunciations',()=>{
 const l=getSoundSpellingLesson('Renoir');expect(l?.ipa).toBe('/rənˈwɑːr/');expect(l?.uk).toBe('/ˈrenwɑː/');
 expect(l?.chunks.map(c=>c.letters).join('')).toBe('Renoir');
 expect(l?.chunks.find(c=>c.stress==='primary')?.letters).toBe('noir');
 expect(l?.sources.some(s=>s.url==='https://www.collinsdictionary.com/dictionary/english/renoir')).toBe(true);
});
