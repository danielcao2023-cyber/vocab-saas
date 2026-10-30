import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('uses the textbook reading for Kazak', () => {
  const word={id:3265,headword:'Kazak'}, result=read(word);
  expect(result.status).toBe('ready'); if(result.status!=='ready') throw new Error('missing');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.pronunciation.ipa).toBe('/kəˈzæk/');
  expect(result.lesson.forms[0].ipa).toBe('/kəˈzæk/');
  expect(result.lesson.sources.some(s=>s.url.includes('655943360'))).toBe(true);
});
it('labels braised as the only sourced part of red braised pork', () => {
  const word={id:3245,headword:'red braised pork'}, result=read(word);
  expect(result.status).toBe('ready'); if(result.status!=='ready') throw new Error('missing');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.takeaway).toContain('braised 部分读作 /breɪzd/');
  expect(result.lesson.takeaway).toContain('不包含 red 和 pork');
  expect(result.lesson.pronunciation.ipa).toBe('');
  expect(result.lesson.forms[0].ipa).toBe('');
  expect(result.lesson.sources.some(s=>s.url.includes('655943360'))).toBe(true);
});
