import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows a sourced pronunciation of the complete Lake Titicaca name without inventing accent labels',()=>{
 const word={id:1745,headword:'Lake Titicaca'};const r=read(word);
 expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.ipa).toBe('/leɪk ˌtɪtɪˈkɑːkə/');
 expect(r.lesson.pronunciation.uk).toBe('');expect(r.lesson.pronunciation.us).toBe('');
 expect(r.lesson.sources.some(s=>s.url==='https://fadelweb.uncoma.edu.ar/wp-content/uploads/2021/03/Diccion-CUADERNILLO-2021.pdf')).toBe(true);
});
