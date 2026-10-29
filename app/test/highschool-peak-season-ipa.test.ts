import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('serves the publisher-attested complete peak season IPA',()=>{const word={id:3858,headword:'peak season'},raw=JSON.parse(fs.readFileSync('data/lessons/3858.json','utf8'));expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');expect(result.lesson?.pronunciation.ipa).toBe('/ˌpiːk ˈsiːzn/');expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url==='https://www.scook.at/cdn_proxy/8e31087a-04df-4a3c-89b8-bf45619447a4/0451750101_0451510101_WL_Lernwortschatz_gesamt.pdf')).toBe(true);});
