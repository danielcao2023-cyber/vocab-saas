import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('serves the dictionary-attested whole phrase pronunciation of straighten up',()=>{const word={id:2938,headword:'straighten up'},raw=JSON.parse(fs.readFileSync('data/lessons/2938.json','utf8'));expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');expect(result.lesson?.pronunciation.ipa).toBe('/ˌstreɪt(ə)n ˈʌp/');expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url==='https://www.easypacelearning.com/pdf/easier_english_student_dictionary_upper-int.pdf')).toBe(true);});
