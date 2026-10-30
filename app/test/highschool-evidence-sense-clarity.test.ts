import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';

const read=createLessonReader('data/lessons');
function lesson(id:number,headword:string){
  const result=read({id,headword});
  expect(result.status).toBe('ready');
  if(result.status!=='ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
  return result.lesson;
}

it('teaches the strong degree of astonish in its meaning and examples',()=>{
 const l=lesson(3308,'astonish');
 expect(l.senses[0].meaning).toMatch(/十分|非常/);
 expect(l.senses[0].examples.every(e=>/十分|非常/.test(e.zh))).toBe(true);
});

it('explains motive as a reason rather than equating it with the goal',()=>{
 const l=lesson(3670,'motive');
 expect(l.senses[0].meaning).toContain('动机');
 expect(l.senses[0].meaning).not.toContain('目的');
 expect(l.takeaway).toMatch(/原因/);
});

it('distinguishes a bodily nerve, courage, and rude audacity in context',()=>{
 const l=lesson(3353,'nerve');
 expect(l.senses.some(s=>s.meaning.includes('神经')&&s.examples.some(e=>e.en.includes('diagram')))).toBe(true);
 expect(l.senses.some(s=>s.meaning.includes('勇气')&&s.examples.some(e=>e.en.includes('speak up')))).toBe(true);
 expect(l.senses.some(s=>/竟敢|厚脸皮/.test(s.meaning)&&s.examples.some(e=>/竟敢|厚着脸皮/.test(e.zh)))).toBe(true);
});
