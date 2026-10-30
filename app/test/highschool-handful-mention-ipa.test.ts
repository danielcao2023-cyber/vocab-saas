import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([
 [3890,'a handful of','/ə ˈhændfʊl əv/','','','https://www.venturesbooks.sk/component/phocadownload/category/132-new-success?download=1562%3Anewsuccess-upp-final'],
 [3967,'not to mention','/nɑːt tə ˈmenʃən/','/nɒt tə ˈmenʃən/','/nɑːt tə ˈmenʃən/','https://dict.cn/not%20to%20mention'],
] as const)('reads sourced whole-phrase pronunciation for %s',(id,headword,ipa,uk,us,url)=>{
 const word={id,headword},result=read(word);expect(result.status).toBe('ready');if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual([ipa,uk,us]);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe(url);
});
