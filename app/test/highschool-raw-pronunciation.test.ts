import {expect,it} from 'vitest';
import fs from 'node:fs';
import {validateLesson} from '../server/src/lessons';
it('distinguishes a documented American raw vowel while allowing regional variation',()=>{const lesson=JSON.parse(fs.readFileSync('data/lessons/3073.json','utf8'));expect(lesson.headword).toBe('raw');expect(lesson.pronunciation.uk).toBe('/rɔː/');expect(lesson.pronunciation.us).toBe('/rɑː/');expect(lesson.pronunciation.accentNote).toContain('/rɔ/');expect(lesson.sources.some((s:any)=>s.url==='https://dictionary.cambridge.org/pronunciation/english/raw')).toBe(true);expect(validateLesson(lesson,{id:3073,headword:'raw'}).ok).toBe(true);});
