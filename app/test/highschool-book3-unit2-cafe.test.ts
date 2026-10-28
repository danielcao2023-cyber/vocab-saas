import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 2 café vocabulary and fills its missing meaning',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2411,'café'],[2412,'waitress'],[2413,'pregnant'],[2414,'disguise'],[2415,'maple'],[2416,'cart'],[2417,'spill'],[2418,'trip over'],[2419,'limp']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['waitress','pregnant','disguise','maple']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='café')?.meaning).toContain('咖啡馆');
});
