import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('serves the directly attested full-phrase IPA for day and night',()=>{const word={id:2029,headword:'day and night'},raw=JSON.parse(fs.readFileSync('data/lessons/2029.json','utf8'));expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');expect(result.lesson?.pronunciation.ipa).toBe('/ˌdeɪ ən ˈnaɪt/');expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url==='https://slovar-vocab.com/english/longman-activator-vocab/continue-6306505.html')).toBe(true);});
