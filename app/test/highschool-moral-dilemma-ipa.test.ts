import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('reads the education source full moral dilemma pronunciation',()=>{
 const word={id:2354,headword:'moral dilemma'},result=read(word);expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual(['/ˈmɒrəl dɪˈlemə/','','']);
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe('https://zpe.gov.pl/a/przeczytaj/D1DJbRRNS');
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
