import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 launch vocabulary and corrects past forms',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2527,'determine'],[2528,'satellite'],[2529,'launch'],[2530,'orbit'],[2531,'giant'],[2532,'leap'],[2533,'leapt'],[2534,'leaped'],[2535,'mankind'],[2536,'agency']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['determine','satellite','orbit','giant','mankind','agency']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='leapt')?.meaning).toContain('过去式');
 expect(catalog.entries.find(e=>e.headword==='agency')?.meaning).toContain('机构');
});
