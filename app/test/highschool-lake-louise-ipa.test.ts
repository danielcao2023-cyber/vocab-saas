import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('reads sourced full pronunciation for Lake Louise in Alberta',()=>{
 const word={id:3323,headword:'Lake Louise'},result=read(word);expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['/leɪk luːˈiːz/','','']);
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe('https://dictionary.reverso.net/english-definition/Lake%2BLouise');
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
