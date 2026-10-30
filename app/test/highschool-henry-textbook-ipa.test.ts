import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it.each([
 [2682,'Henry Adams','/ˈhenri ˈædəmz/'],
 [2440,'Henry Norman Bethune','/ˈhenri ˈnɔːmən bəˈθjuːn/'],
] as const)('shows the complete textbook name pronunciation for %s',(id,headword,ipa)=>{
 const word={id,headword};const r=read(word);expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.ipa).toBe(ipa);
 expect(r.lesson.pronunciation.uk).toBe('');expect(r.lesson.pronunciation.us).toBe('');
 expect(r.lesson.sources.some(s=>s.url==='https://file.xdf.cn/uploads/200306/230_200306151128gtoBw7cBguH928QO.pdf')).toBe(true);
});
