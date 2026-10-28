import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 1 vocabulary and corrects set off',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2324,'represent'],[2325,'wrestling'],[2326,'wrestle'],[2327,'wrestler'],[2328,'archery'],[2329,'set off'],[2330,'fancy'],[2331,'robe']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['represent','wrestling','wrestle','wrestler','archery','fancy']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='set off')?.meaning).toContain('出发');
 expect(catalog.entries.find(e=>e.headword==='represent')?.meaning).not.toContain('再赠送');
});
