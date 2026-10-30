import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('reads full sourced pronunciation of to name but a few',()=>{
 const word={id:2494,headword:'to name but a few'},result=read(word);expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['/tə ˈneɪm bət ə fjuː/','','']);
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe('https://www.business-english.com.pl/dodatki/BEM%2067%20lista%20slow.pdf');
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
