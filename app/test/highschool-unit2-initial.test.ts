import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';
const words=[{id:1685,headword:'castle'},{id:1686,headword:'apply'},{id:1687,headword:'apply for'},{id:1688,headword:'visa'},{id:1689,headword:'rent'},{id:1690,headword:'amazed'}];
it('provides reviewed lessons and pronunciation-spelling maps for the initial Unit 2 entries',()=>{
 const read=createLessonReader();for(const w of words){const result=read(w);expect(result.status,w.headword).toBe('ready');expect(getSoundSpellingLesson(w.headword),w.headword).toBeDefined();}
});
it('preserves the distinction between surprised feelings and surprising qualities',()=>{
 const result=createLessonReader()({id:1690,headword:'amazed'});expect(result.status).toBe('ready');if(result.status!=='ready')return;
 expect(JSON.stringify(result.lesson)).not.toMatch(/amazed\s*修饰人，amazing\s*修饰事物/);expect(JSON.stringify(result.lesson)).toContain('amazing');
});
it('bundles documented human recordings for the verified initial Unit 2 single words',()=>{
 const m=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 for(const w of ['castle','apply','visa','rent','amazed']){const e=m.entries[w];expect(e?.author,w).toBeTruthy();expect(e?.licenseUrl,w).toMatch(/^https:\/\/creativecommons.org\//);expect(fs.existsSync(new URL('../data/pronunciation/'+e.file,import.meta.url)),w).toBe(true);}
});
