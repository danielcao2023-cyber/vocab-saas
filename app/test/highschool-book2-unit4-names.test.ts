import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 4 historical and geographical names',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2171,'Wales'],[2172,'Scotland'],[2173,'Northern Ireland'],[2174,'Anglo-Saxon'],[2175,'Viking'],[2176,'Norman'],[2177,'the Normans'],[2178,'Battle of Hastings'],[2179,'Roman'],[2180,'Van Gogh'],[2181,'the Emerald Isle'],[2182,'Irish']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Scotland','Viking','Norman','Roman','Irish']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
