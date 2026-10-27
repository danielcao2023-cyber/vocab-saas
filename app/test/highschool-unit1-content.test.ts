import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';
const targets=JSON.parse(fs.readFileSync(new URL('../qa/highschool-unit1/targets.json',import.meta.url),'utf8')).words as {id:number;headword:string;existingLesson:boolean}[];
it('serves a complete reviewed lesson for every entry in high-school Unit 1',()=>{
 expect(targets).toHaveLength(56);const read=createLessonReader();for(const w of targets)expect(read(w).status,w.headword).toBe('ready');
});
it('provides reviewed pronunciation/spelling maps for every newly added Unit 1 entry',()=>{
 const fresh=targets.filter(w=>!w.existingLesson);expect(fresh).toHaveLength(42);for(const w of fresh)expect(getSoundSpellingLesson(w.headword),w.headword).toBeDefined();
});
it('keeps title spelling and Seoul pronunciation corrections explicit',()=>{
 const read=createLessonReader(),title=read({id:1653,headword:'title'});expect(title.status).toBe('ready');if(title.status!=='ready')return;
 expect(title.lesson.forms.some(f=>f.form==='titled')).toBe(true);expect(title.lesson.forms.some(f=>f.form==='titling')).toBe(true);expect(JSON.stringify(title.lesson)).not.toMatch(/双写t结尾|直接加-ling/);
 expect(getSoundSpellingLesson('Seoul')?.ipa).toBe('/soʊl/');
});
it('publishes audited recordings while keeping the seven unresolved whole patterns explicit',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 const pending=['prefer ... to ...','suitable for','sign up for sth.','be responsible for','be attracted to','focus on','addicted to'];
 expect(targets.filter(w=>manifest.entries[w.headword])).toHaveLength(49);
 expect(targets.filter(w=>!manifest.entries[w.headword]).map(w=>w.headword)).toEqual(pending);
 for(const word of targets.filter(w=>!w.existingLesson&&!pending.includes(w.headword))){const recording=manifest.entries[word.headword];expect(recording.author,word.headword).toBeTruthy();expect(recording.licenseUrl,word.headword).toMatch(/^https:\/\/creativecommons.org\//);expect(fs.existsSync(new URL('../data/pronunciation/'+recording.file,import.meta.url)),word.headword).toBe(true);}
 expect(manifest.entries.content.pronunciationNote).toContain('名词');expect(manifest.entries.addict.pronunciationNote).toContain('名词');expect(manifest.entries.Seoul.pronunciationNote).toContain('同音');
});
