import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows the entire textbook name of Beijing’s Forbidden City',()=>{
 const word={id:1983,headword:'the Forbidden City'};const result=read(word);
 expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('/ðə fəˈbɪdn ˈsɪti/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.sources.some(s=>s.url.includes('yyld.51jiaoxi.com/bixiuer'))).toBe(true);
});
