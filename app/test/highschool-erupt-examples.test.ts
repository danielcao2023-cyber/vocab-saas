import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('shows a single non-duplicated lava example with the correct translation',()=>{
 const word={id:1826,headword:'erupt'},result=createLessonReader()(word);expect(result.status).toBe('ready');const lesson=result.lesson!;expect(validateLesson(lesson,word).ok).toBe(true);const examples=lesson.senses.flatMap(s=>s.examples).filter(e=>e.en==='The volcano erupted lava during the night.');expect(examples).toHaveLength(1);expect(examples[0].zh).toContain('熔岩');
});
