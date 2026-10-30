import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('uses the Longman guide transcription of more like in a colour comparison',()=>{
 const word={id:3758,headword:'more like'};
 const result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('/mɔː laɪk/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-ipa');
 expect(result.lesson.sources.find(s=>s.id==='full-ipa')?.url).toBe('https://ndl.ethernet.edu.et/bitstream/123456789/4547/1/72.pdf');
});
