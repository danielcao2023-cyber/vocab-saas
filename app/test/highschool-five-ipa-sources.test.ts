import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([
 [2804,'in this sense','/ɪn ðɪs sens/','','','https://xn--rgb3cde.com/file/04100103.pdf'],
 [3197,'as far as I am concerned','/æz fɑɹ æz aɪ æm kənsəɹnd/','','/æz fɑɹ æz aɪ æm kənsəɹnd/','https://www.spanishdict.com/pronunciation/as%20far%20as%20I%20am%20concerned'],
 [3611,'Hurricane Katrina','/ˈhʌrɪkən kəˈtriːnə/','','','https://fltrp-gy.oss-cn-shanghai.aliyuncs.com/gykejianupload/2459/files/yangzhang3.pdf'],
 [3756,'test out','/test aʊt/','/test aʊt/','/test aʊt/','https://lingolandedu.com/en/english-english-dictionary/test-out'],
] as const)('reads whole-phrase or proper-name IPA for %s',(id,headword,ipa,uk,us,url)=>{
 const word={id,headword};const result=read(word);expect(result.status).toBe('ready');
 if(result.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual([ipa,uk,us]);
 expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
 expect(result.lesson.sources.find(x=>x.id==='full-pronunciation')?.url).toBe(url);
});
it('identifies the dictionary transcription as unmarked stress',()=>{
 const result=read({id:3197,headword:'as far as I am concerned'});if(result.status!=='ready')throw new Error('missing lesson');
 expect(result.lesson.pronunciation.accentNote).toContain('原词典未标重音');
});
