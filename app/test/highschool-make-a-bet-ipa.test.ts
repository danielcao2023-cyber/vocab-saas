import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('retains the source transcription and does not invent stress or a UK pronunciation',()=>{
 const word={id:2625,headword:'make a bet'};const r=read(word);expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.us).toBe('/meɪk ə bet/');
 expect(r.lesson.pronunciation.uk).toBe('');
 expect(r.lesson.sources.some(s=>s.url==='https://dict.youdao.com/w/eng/make_a_bet/')).toBe(true);
});
