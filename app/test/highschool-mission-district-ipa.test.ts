import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('labels the textbook mission reading as a partial independent word',()=>{
 const word={id:2506,headword:'the Mission District'},r=createLessonReader('data/lessons')(word);
 expect(r.status).toBe('ready'); if(r.status!=='ready')throw Error('missing lesson');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.ipa).toBe('mission 单独读音：/ˈmɪʃn/');
 expect(r.lesson.forms[0].ipa).toBe(r.lesson.pronunciation.ipa);
 expect(r.lesson.takeaway).toContain('不包含 the 和 District');
 expect(r.lesson.sources.some(s=>s.url==='https://book.pep.com.cn/1412001123191/')).toBe(true);
});
