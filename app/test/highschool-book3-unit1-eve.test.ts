import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 1 festival vocabulary and correct turkey meaning',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2305,'eve'],[2306,'envelope'],[2307,'Christmas carol'],[2308,'merry'],[2309,'Merry Christmas!'],[2310,'pumpkin'],[2311,'pudding'],[2312,'mashed potatoes'],[2313,'roast'],[2314,'turkey'],[2315,'roast turkey']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['envelope','merry','pumpkin','pudding','turkey']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='turkey')?.meaning).toContain('火鸡');
 expect(catalog.entries.find(e=>e.headword==='merry')?.meaning).not.toContain('樱桃');
});
