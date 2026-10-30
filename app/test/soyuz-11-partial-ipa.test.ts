import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('labels the textbook and dictionary Soyuz variants and excludes 11', () => {
 const word={id:1,headword:'Soyuz 11'}, result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready'); if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('Soyuz 部分：教材 /sɔːˈjuːz/；词典 /ˈsɔɪjuːz/ 或 /ˈsɔːjuːz/');
 expect(result.lesson.pronunciation.uk).toBe(''); expect(result.lesson.pronunciation.us).toBe('');
 expect(result.lesson.takeaway).toContain('不含编号 11'); expect(result.lesson.takeaway).toContain('教材与词典的重音标注不同');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toEqual(expect.arrayContaining(['textbook-ipa','name-pronunciation']));
});
