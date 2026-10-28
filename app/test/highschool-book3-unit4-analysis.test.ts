import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 4 analysis vocabulary and distinguishes the plural pronunciation',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2577,'analysis'],[2578,'analyses'],[2579,'as a result'],[2580,'high-end'],[2581,'monitor'],[2582,'regularly'],[2583,'regular'],[2584,'foam'],[2585,'pillow'],[2586,'smartphone']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['analysis','analyses','monitor','regularly','regular','pillow','smartphone']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='analyses')).toMatchObject({phonetic:'/əˈnæləsiːz/',phoneticCorrection:{expected:'[əˈnæləsɪs; ˈænəlaɪzɪz]'}});
});
