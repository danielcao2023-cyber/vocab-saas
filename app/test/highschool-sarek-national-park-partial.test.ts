import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('明确 national park 的独立读音与公园名称的区别', () => {
 const word={id:2901,headword:'Sarek National Park'}, result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if(result.status!=='ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.takeaway).toContain('national park 单独读作英式 /ˌnæʃ.ən.əl ˈpɑːk/、美式 /ˌnæʃ.ən.əl ˈpɑːrk/');
 expect(result.lesson.takeaway).toContain('不包含 Sarek');
 expect(result.lesson.pronunciation.ipa).toBe('');
 expect(result.lesson.forms[0].ipa).toBe('');
 expect(result.lesson.sources.some(s=>s.url.includes('dictionary.cambridge.org/us/pronunciation/english/national-park'))).toBe(true);
});
