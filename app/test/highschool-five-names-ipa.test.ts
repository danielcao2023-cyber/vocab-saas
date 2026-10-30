import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([
  [2567,'microwave oven','/ˌmaɪkrəʊˌweɪv ˈʌvn/','/ˌmaɪkrəʊˌweɪv ˈʌvn/','','https://www.collinsdictionary.com/us/dictionary/english/microwave-oven'],
  [3330,'Quebec City','/kəˈbɛk ˈsɪti/','','','https://en.wiktionary.org/wiki/Quebec_City'],
  [3610,'Svalbard','/ˈsvɑlbɑɹd/','/ˈsvælbɑːd/','/ˈsvɑlbɑɹd/','https://en.wiktionary.org/wiki/Svalbard'],
  [3749,'Robert Browning','/ˈrɒbət ˈbraʊnɪŋ/','','','https://www.socionauki.ru/upload/socionauki.ru/journal/infobr_rus/2024_1/%D0%9A%D0%B0%D1%80%D0%B0%D1%87%D0%B5%D0%B2%D0%B0%D0%90%D0%9A.pdf'],
  [3950,'Marco Polo','/ˈmɑːkəʊ ˈpəʊləʊ/','/ˈmɑːkəʊ ˈpəʊləʊ/','','https://www.collinsdictionary.com/us/dictionary/english/marco-polo'],
] as const)('reads sourced full pronunciation for %s',(id,headword,ipa,uk,us,url)=>{
 const word={id,headword}; const result=read(word); expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual([ipa,uk,us]);
 expect(result.lesson.sources.find(s=>s.id==='full-pronunciation')?.url).toBe(url);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
it('records alternative English Svalbard variants and Canadian Quebec City pronunciation',()=>{
 const sval=read({id:3610,headword:'Svalbard'}),qc=read({id:3330,headword:'Quebec City'});
 if(sval.status!=='ready'||qc.status!=='ready')throw new Error('missing lesson');
 expect(sval.lesson.pronunciation.accentNote).toContain('/ˈsvɑlbɑɹ/');
 expect(sval.lesson.pronunciation.accentNote).toContain('/ˈsvælbɑː/');
 expect(qc.lesson.pronunciation.accentNote).toContain('加拿大英语');
 expect(qc.lesson.pronunciation.accentNote).toContain('/kwɪˈbɛk ˈsɪti/');
});
