import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([[3459,'frame','s3','陷害'], [3468,'civil','s3','民用'], [3468,'civil','s4','民事']] as const)('reads %s %s %s', (id,headword,senseId,title) => {
 const result=read({id,headword}); expect(result.status).toBe('ready');
 if(result.status!=='ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
 expect(result.lesson.senses.find(s=>s.id==='s1')?.examples.length).toBeGreaterThanOrEqual(2);
 const sense=result.lesson.senses.find(s=>s.id===senseId); expect(sense?.title).toContain(title); expect(sense?.examples.length).toBeGreaterThanOrEqual(2);
});
