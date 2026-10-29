import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Oxford pronunciation for real estate agent',()=>{
 const lesson=getSoundSpellingLesson('real estate agent');expect(lesson?.ipa).toBe('/ˈriːəl ɪsteɪt eɪdʒənt/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('real estate agent');
 expect(lesson?.sources.some(s=>s.url==='https://www.oxfordlearnersdictionaries.com/definition/english/real-estate-agent')).toBe(true);
});
