import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';

it('shows the complete publisher wordlist pronunciation for make inferences',()=>{
 const word={id:2923,headword:'make inferences'};
 const result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('/ˌmeɪk ˈɪnfərənsɪz/');
 expect(result.lesson.forms[0].ipa).toBe('/ˌmeɪk ˈɪnfərənsɪz/');
 expect(result.lesson.pronunciation.sourceIds).toContain('full-ipa');
 expect(result.lesson.sources.find(s=>s.id==='full-ipa')?.url).toBe('https://www.venturesbooks.sk/component/phocadownload/category/151-high-note?download=1694%3Ahn-4-slovnicek-sk');
});
