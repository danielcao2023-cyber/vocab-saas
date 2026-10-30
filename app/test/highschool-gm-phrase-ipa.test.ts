import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';

const read=createLessonReader('data/lessons');
it.each([
 [2827,'keep in touch with ...','/kiːp ɪn ˈtʌtʃ wɪð/','https://bbspainresources.s3.eu-central-1.amazonaws.com/Skills2_AppendGal.pdf'],
 [4086,'Marie Curie','/ˌmæri ˈkjʊəri/','https://cdnc.heyzine.com/files/uploaded/v3/eb8bf04c8b1570960921db3ac8ae139933c1edad.pdf'],
] as const)('retains the complete sourced pronunciation for %s',(id,headword,ipa,url)=>{
 const word={id,headword}; const result=read(word);
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe(ipa);
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.sources.find(source=>source.id==='full-ipa')?.url).toBe(url);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-ipa');
});
it('explains that the object placeholder of keep in touch with is supplied by the learner',()=>{
 const lesson=read({id:2827,headword:'keep in touch with ...'}).lesson!;
 expect(lesson.pronunciation.accentNote).toContain('省略号');
});
