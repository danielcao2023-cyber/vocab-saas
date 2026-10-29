import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('serves the publisher-attested complete IPA for at last',()=>{const word={id:1618,headword:'at last'},raw=JSON.parse(fs.readFileSync('data/lessons/1618.json','utf8'));expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');expect(result.lesson?.pronunciation.ipa).toBe('/ət ˈlɑːst/');expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url==='https://www.scook.at/cdn_proxy/7cda8b21-2a47-4e24-a477-d330c8fd04d7/234215_0470590101_47058_EIC_5_Alphabetical_word_list.pdf')).toBe(true);});
