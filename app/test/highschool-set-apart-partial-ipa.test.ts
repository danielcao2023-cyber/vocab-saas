import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
it('只展示词典注明的 set apart 局部读音', () => {
 const word={id:3420,headword:'set apart from'}, result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if(result.status!=='ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.takeaway).toContain('set apart 单独读作 /ˈsɛt əˈpɑrt/');
 expect(result.lesson.takeaway).toContain('不包含 from 和宾语');
 expect(result.lesson.pronunciation.ipa).toBe('');
 expect(result.lesson.forms[0].ipa).toBe('');
 expect(result.lesson.sources.some(s=>s.url==='https://dictionary.cambridge.org/dictionary/english-spanish/set-apart')).toBe(true);
});
