import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows a sourced complete Magellan name without inventing accent labels',()=>{
 const word={id:3954,headword:'Ferdinand Magellan'};const r=read(word);
 expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.ipa).toBe('/ˈfɜːdɪnənd məˈɡelən/');
 expect(r.lesson.pronunciation.uk).toBe('');expect(r.lesson.pronunciation.us).toBe('');
 expect(r.lesson.pronunciation.accentNote).toContain('变体');
 expect(r.lesson.sources.some(s=>s.url==='https://www.yeyulingfeng.com/wendang/640413.html')).toBe(true);
});
