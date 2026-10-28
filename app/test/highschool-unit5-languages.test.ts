import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 language and organization entries',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1903,'Korean'],[1904,'Danish'],[1905,'Denmark'],[1906,'Arabic'],[1907,'FIFA']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['Korean','Danish','Denmark','Arabic']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('corrects FIFA and Arabic with expected-value safeguards',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../data/vocabulary/catalog.json',import.meta.url),'utf8'));const e=(w:string)=>c.entries.find((x:{headword:string})=>x.headword===w);
 expect(e('FIFA').meaning).toContain('国际足球联合会');expect(e('FIFA').meaningCorrection.expected).toContain('费法');expect(e('Arabic').meaning).toContain('阿拉伯语');expect(e('Arabic').meaningCorrection.expected).toContain('阿拉伯人的');expect(c.version).toBeGreaterThanOrEqual(8);
});
