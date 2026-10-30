import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('reads the dictionary pronunciation for the historical battle without assuming an accent',()=>{
 const word={id:2178,headword:'Battle of Hastings'},result=read(word);expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['/ˈbætl̩ əv ˈheɪstɪŋz/','','']);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe('https://en.onlinerecnik.com/lexicon/english/battle-of-hastings');
});
