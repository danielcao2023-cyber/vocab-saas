import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';

it('explains the spelling role of the final e in engage',()=>{
 const lesson=getSoundSpellingLessons('engage')[0];
 expect(lesson.ipa).toBe('/ɪnˈɡeɪdʒ/');
 expect(lesson.variantNote).toContain('e 不单独发音，也提示这里的 g 为软音');
 expect(lesson.sources.some(s=>s.url==='https://www.spellzone.com/unit19/page8.cfm')).toBe(true);
});
