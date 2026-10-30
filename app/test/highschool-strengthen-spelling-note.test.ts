import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index.ts';
it('aligns strengthen spelling pairs and the pronunciation reminder',()=>{
 const word=getSoundSpellingLessons('strengthen')[0];
 expect(word).toBeDefined();
 expect(word.chunks.flatMap(c=>c.pairs)).toEqual(expect.arrayContaining([{letters:'ng',sound:'/ŋ/'},{letters:'th',sound:'/θ/'}]));
 expect(word.variantNote).toContain('ng 对应 /ŋ/');
 expect(word.variantNote).toContain('g 不另发 /ɡ/');
 expect(word.variantNote).not.toContain('gh 在此不单独发音');
});
