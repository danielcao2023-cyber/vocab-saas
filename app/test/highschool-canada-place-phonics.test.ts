import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides pronunciation spelling for four Canadian places and notes Toronto variants',()=>{
 for(const w of ['Vancouver','Toronto','Edmonton','Ontario']) expect(getSoundSpellingLesson(w),w).toBeDefined();
 expect(getSoundSpellingLesson('Toronto')?.variantNote).toMatch(/省略|不发/);
 expect(getSoundSpellingLesson('Vancouver')?.chunks.find(c=>c.stress==='primary')?.letters).toBe('cou');
 expect(getSoundSpellingLesson('Ontario')?.chunks.find(c=>c.stress==='primary')?.letters).toBe('tar');
});
it('covers Jasper, Winnipeg and Montreal with their documented stresses',()=>{
 for(const w of ['Jasper','Winnipeg','Montreal']) expect(getSoundSpellingLesson(w),w).toBeDefined();
 expect(getSoundSpellingLesson('Winnipeg')?.chunks.find(c=>c.stress==='secondary')?.letters).toBe('peg');
 expect(getSoundSpellingLesson('Montreal')?.chunks.find(c=>c.stress==='primary')?.letters).toBe('al');
});
