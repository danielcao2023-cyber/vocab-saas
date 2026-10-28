import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 2 names and corrected institution meanings',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2430,'per'],[2431,'tension'],[2432,'Peking Union Medical College'],[2433,'the Wenhai Scholarship'],[2434,'the OB-GYN department'],[2435,'Department of Obstetrics and Gynecology'],[2436,"the People's Republic of China"],[2437,"the National People's Congress"],[2438,'the North Pole'],[2439,'the South Pole'],[2440,'Henry Norman Bethune']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 expect(getSoundSpellingLesson('tension')).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='Department of Obstetrics and Gynecology')?.meaning).toContain('妇产科');
 expect(catalog.entries.find(e=>e.headword==="the National People's Congress")?.meaning).not.toContain('常委会');
});
