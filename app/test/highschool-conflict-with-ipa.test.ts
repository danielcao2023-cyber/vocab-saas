import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows conflict with using the verb pronunciation and leaves accent unspecified',()=>{
 const word={id:3792,headword:'conflict with'};const r=read(word);
 expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.ipa).toBe('/kənˈflɪkt wɪð/');
 expect(r.lesson.pronunciation.uk).toBe('');expect(r.lesson.pronunciation.us).toBe('');
 expect(r.lesson.sources.some(s=>s.url==='https://vn.elsaspeak.com/suit-di-voi-gioi-tu-gi/')).toBe(true);
});
