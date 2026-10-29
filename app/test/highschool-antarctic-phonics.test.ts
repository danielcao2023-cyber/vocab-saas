import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps the full phrase the Antarctic to the sourced British reading',()=>{
 const lesson=getSoundSpellingLesson('the Antarctic');
 expect(lesson?.ipa).toBe('/ðiː ænˈtɑːktɪk/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('the Antarctic');
 expect(lesson?.sources.some(s=>s.url==='https://assets.cambridge.org/97813166/31744/index/9781316631744_index.pdf')).toBe(true);
 expect(lesson?.variantNote).toMatch(/美式/);
});
