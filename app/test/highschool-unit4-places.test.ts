import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 4 geographical and personal names',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1845,'Ecuador'],[1846,'Memphis'],[1847,'Alberta'],[1848,'Colombo'],[1849,'Sri Lanka'],[1850,'Indonesia'],[1851,'Thailand'],[1852,'Malaysia'],[1853,'Sumatra Island'],[1854,'Chandra Theeravit']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Ecuador','Indonesia','Thailand','Malaysia']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('protects specific corrections to Colombo and Malaysia when upgrading',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../data/vocabulary/catalog.json',import.meta.url),'utf8'));
 const colombo=catalog.entries.find((w:{headword:string})=>w.headword==='Colombo');const malaysia=catalog.entries.find((w:{headword:string})=>w.headword==='Malaysia');
 expect(colombo.meaning).toContain('商业首都');expect(colombo.meaningCorrection.expected).toBe('n. 科伦坡（斯里兰卡首都）');
 expect(malaysia.phonetic).toBe('/məˈleɪʒə/');expect(malaysia.phoneticCorrection.expected).toBe('[məˈlezɪr]');expect(malaysia.meaning).not.toContain('马来群岛');expect(catalog.version).toBeGreaterThanOrEqual(5);
});
