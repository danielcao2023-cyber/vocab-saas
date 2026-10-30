import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('keeps modern shark noun meanings without teaching unsupported verb frames',()=>{
 const r=read({id:1225,headword:'shark'});expect(r.status).toBe('ready');
 if(r.status!=='ready')throw new Error('missing lesson');
 expect(validateLesson(r.lesson,{id:1225,headword:'shark'}).ok).toBe(true);
 const l=r.lesson;expect(l.senses.some(s=>s.meaning.includes('鱼'))).toBe(true);
 expect(l.senses.some(s=>s.meaning.includes('盘剥'))).toBe(true);
 expect(l.takeaway).toMatch(/古旧|古语/);
 expect(JSON.stringify(l)).not.toMatch(/shark(?:ed)? (?:someone|people|a tourist|her|a visitor) out of/i);
 expect(l.sources.some(s=>s.url.includes('merriam-webster.com/dictionary/shark')&&s.supports.some(x=>/古旧|古语/.test(x)))).toBe(true);
});
