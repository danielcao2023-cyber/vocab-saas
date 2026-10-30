import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('reads complete sourced sense of touch IPA without inventing an accent',()=>{
 const word={id:3340,headword:'sense of touch'};const result=read(word);expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['/sens əv ˈtʌtʃ/','','']);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe('https://ihed.org.ua/wp-content/uploads/2019/01/Pedagog-Slovnik_ukr-engl_2013_Avshenuk-Prohur.pdf');
});
