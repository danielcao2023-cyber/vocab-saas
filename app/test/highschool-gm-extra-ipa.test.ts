import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';
const read=createLessonReader('data/lessons');
it.each([
 [3218,'lamb kebab','/læm kɪˈbæb/','https://www.scribd.com/document/780699795/'],
 [3516,"make up one's mind",'/meɪk ʌp wʌnz maɪnd/','https://www.webdictionary.co.uk/words/make_up_one%27s_mind'],
] as const)('uses a fully sourced pronunciation for %s',(id,headword,ipa,url)=>{
 const word={id,headword};const result=read(word);expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe(ipa);
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-ipa');
 expect(result.lesson.sources.find(s=>s.id==='full-ipa')?.url).toContain(url);
});
it('explains that one’s is replaced according to the subject',()=>{
 const result=read({id:3516,headword:"make up one's mind"});
 expect(result.lesson?.pronunciation.accentNote).toContain('替换');
});
