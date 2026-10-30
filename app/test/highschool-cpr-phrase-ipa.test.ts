import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows the complete US pronunciation of cardiopulmonary resuscitation from Cambridge',()=>{
 const word={id:3407,headword:'cardiopulmonary resuscitation'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 const ipa='/ˌkɑːr.di.oʊˌpʊl.mə.ner.i rɪˌsʌs.əˈteɪ.ʃən/';
 expect(result.lesson.pronunciation.ipa).toBe(ipa);
 expect(result.lesson.pronunciation.us).toBe(ipa);
 expect(result.lesson.pronunciation.uk).toBe('');
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.sources.some(s=>s.url==='https://dictionary.cambridge.org/us/pronunciation/english/cardiopulmonary-resuscitation')).toBe(true);
});
