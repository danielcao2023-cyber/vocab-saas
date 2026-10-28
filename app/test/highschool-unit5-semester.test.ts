import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 regional vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1891,'semester'],[1892,'petrol'],[1893,'subway'],[1894,'pants'],[1895,'beg'],[1896,'equal']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['semester','petrol','subway','pants','beg','equal']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('keeps guarded British and American meaning corrections',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../data/vocabulary/catalog.json',import.meta.url),'utf8'));const entries=new Map(c.entries.map((e:{headword:string})=>[e.headword,e]));
 for(const [word,expected] of [['subway','n. 地铁；地道\nvi. 乘地铁'],['pants','n. 裤子']] as const){const e=entries.get(word) as {meaning:string;meaningCorrection:{expected:string}};expect(e.meaning).toContain('美');expect(e.meaning).toContain('英');expect(e.meaningCorrection.expected).toBe(expected);}expect(c.version).toBeGreaterThanOrEqual(7);
});
