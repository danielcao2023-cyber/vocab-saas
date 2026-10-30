import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('reads the sourced Scottish town IPA via its keyed lesson', () => {
 const word={id:13111,headword:'St Andrews'}, result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready'); if(result.status!=='ready') throw new Error('missing');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('/sənt ˈændruːz/');
 expect(result.lesson.forms[0].ipa).toBe('/sənt ˈændruːz/');
 expect(result.lesson.sources.some(s=>s.url.includes('Spotlight5.pdf'))).toBe(true);
});
