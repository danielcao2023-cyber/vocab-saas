import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides reviewed Book 2 Unit 5 names and corrects UNICEF current meaning',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2247,'Eric Whitacre'],[2248,'Nevada'],[2249,'Mozart'],[2250,'Lux Aurumque'],[2251,'UNICEF'],[2252,"United Nations Children's Fund"],[2253,'Las Vegas'],[2254,'John A. Logan']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Nevada','Mozart','UNICEF'])expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='UNICEF')).toMatchObject({meaning:'abbr. 联合国儿童基金会；UNICEF 为沿用的历史简称'});
});
