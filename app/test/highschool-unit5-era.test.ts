import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 era vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1885,'specific'],[1886,'CE'],[1887,'Common Era'],[1888,'struggle'],[1889,'tongue'],[1890,'point of view']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['specific','struggle','tongue']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('corrects CE for the textbook while retaining the guarded old value',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../data/vocabulary/catalog.json',import.meta.url),'utf8'));const e=catalog.entries.find((w:{headword:string})=>w.headword==='CE');
 expect(e.meaning).toContain('公元');expect(e.meaning).toContain('其他含义');expect(e.meaningCorrection.expected).toContain('Chemical Engineer');expect(catalog.version).toBeGreaterThanOrEqual(6);
});
