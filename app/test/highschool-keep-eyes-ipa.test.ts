import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('uses the complete textbook wordlist pronunciation of keep your eyes open for',()=>{
 const word={id:2144,headword:'keep your eyes open for'};
 const result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.pronunciation.ipa).toBe('/kiːp jɔː(r) ˈaɪz ˈəʊpən fə(r)/');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.accentNote).toContain('连读');
 expect(result.lesson.pronunciation.sourceIds).toContain('full-ipa');
 expect(result.lesson.sources.find(s=>s.id==='full-ipa')?.url).toBe('https://yyld.51jiaoxi.com/bixiuer/rjb_danci.html');
});
