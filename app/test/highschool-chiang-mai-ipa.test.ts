import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('reads a sourced pronunciation of the Thai city with an alternate form',()=>{
 const word={id:3897,headword:'Chiang Mai'},result=read(word);expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['/t͡ʃi.ɑːŋ ˈmaɪ/','','']);
 expect(result.lesson.pronunciation.accentNote).toContain('/ˈtʃæŋ ˈmaɪ/');
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe('https://en.wiktionary.org/wiki/Chiang_Mai');
 expect(result.lesson.sources.find(x=>x.id==='alternate-pronunciation')?.url).toBe('https://en.onlinerecnik.com/lexicon/english/chiang-mai');
});
