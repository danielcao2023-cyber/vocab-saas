import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 1 proposal vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1920,'give way to'],[1921,'keep balance'],[1922,'lead to'],[1923,'dam'],[1924,'proposal'],[1925,'make a proposal']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['dam','proposal']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('corrects phrase summaries with original-value safeguards',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../data/vocabulary/catalog.json',import.meta.url),'utf8'));const e=(w:string)=>c.entries.find((x:{headword:string})=>x.headword===w);
 expect(e('make a proposal').meaning).toContain('提出建议');expect(e('make a proposal').meaningCorrection.expected).toBe('na. 求婚');expect(e('lead to').meaning).toContain('导致');expect(e('give way to').meaning).toContain('取代');expect(c.version).toBeGreaterThanOrEqual(9);
});
