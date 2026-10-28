import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 procedure vocabulary and textbook meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2517,'procedure'],[2518,'mental'],[2519,'cm'],[2520,'centimetre'],[2521,'centimeter'],[2522,'intelligent'],[2523,'gravity'],[2524,'frontier'],[2525,'vehicle'],[2526,'determined']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['procedure','mental','centimetre','centimeter','intelligent','gravity','frontier','vehicle','determined']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='mental')?.meaning).toContain('心理');
 expect(catalog.entries.find(e=>e.headword==='cm')?.meaning).toBe('abbr. 厘米');
});
