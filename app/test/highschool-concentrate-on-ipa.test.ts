import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('serves publisher-attested complete IPA for concentrate on',()=>{const word={id:1626,headword:'concentrate on'},raw=JSON.parse(fs.readFileSync('data/lessons/1626.json','utf8'));expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');expect(result.lesson?.pronunciation.ipa).toBe('/ˈkɒnsntreɪt ɒn/');expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url==='https://bbspainresources.s3.eu-central-1.amazonaws.com/LearningSkills1_AppendGal.pdf')).toBe(true);});
