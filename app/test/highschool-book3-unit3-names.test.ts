import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 3 textbook names with meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2511,'Huangguoshu Waterfall'],[2512,'Journey to the West'],[2513,'Tin How Temple'],[2514,'Bank of Canton'],[2515,'Portsmouth'],[2516,'Robert Louis Stevenson']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 expect(catalog.entries.find(e=>e.headword==='Bank of Canton')?.meaning).toContain('广东银行');
 expect(catalog.entries.find(e=>e.headword==='Tin How Temple')?.meaning).toContain('天后庙');
});
