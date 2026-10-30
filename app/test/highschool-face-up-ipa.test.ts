import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('reads sourced face up pronunciation for the upward-facing sense',()=>{
 const word={id:3394,headword:'face up'},result=read(word);expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.senses.some(x=>x.meaning==='面朝上')).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['/feɪs ʌp/','/feɪs ʌp/','/feɪs ʌp/']);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe('https://dict.cn/face%20up');
});
