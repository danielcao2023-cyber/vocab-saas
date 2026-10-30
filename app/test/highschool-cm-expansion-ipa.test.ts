import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('labels the British singular reading of centimetre behind cm',()=>{
 const word={id:2519,headword:'cm'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('centimetre 英式读法：/ˈsentɪmiːtə(r)/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.takeaway).toContain('复数时读 centimetres');
 expect(result.lesson.sources.some(s=>s.url==='https://www.oxfordlearnersdictionaries.com/definition/english/centimetre')).toBe(true);
});
