import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('shows the textbook reading of explorer Ernest Shackleton',()=>{
 const word={id:3672,headword:'Ernest Shackleton'},r=createLessonReader('data/lessons')(word);
 expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.ipa).toBe('/ˈɜːnɪst ˈʃæklətən/');
 expect(r.lesson.forms[0].ipa).toBe('/ˈɜːnɪst ˈʃæklətən/');
 expect(r.lesson.sources.some(s=>s.url.includes('1826865835'))).toBe(true);
});
