import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([[3530, 'skip'], [905, 'negative']] as const)('reads validated lesson %s %s', (id, headword) => {
 const result = read({ id, headword });
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, { id, headword }).ok).toBe(true);
 if (headword === 'skip') {
  expect(result.lesson.senses.find(s => s.id === 's1')?.examples.map(e => e.id)).toContain('s1-e1');
  const sense = result.lesson.senses.find(s => s.id === 's5');
  expect(sense?.usageNote).toContain('英式');
  expect(sense?.examples.map(e => e.id)).toEqual(['s5-e1', 's5-e2']);
 } else {
  const sense = result.lesson.senses.find(s => s.id === 's2');
  expect(sense?.examples.map(e => e.id)).toEqual(expect.arrayContaining(['s2e1', 's2e2', 's2e3']));
  expect(sense?.examples.find(e => e.id === 's2e3')?.en).toContain('negative effect on');
 }
});
