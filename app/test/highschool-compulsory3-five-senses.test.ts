import {expect, it} from 'vitest';
import {createLessonReader, validateLesson} from '../server/src/lessons.ts';
const reader = createLessonReader('data/lessons');
it.each([[2313,'roast','烤过的'],[2319,'go off','食物变质'],[2337,'clap','掌声'],[2355,'faint','昏倒'],[2396,'whisper','耳语']])('loads checked usage %s %s', (id,headword,title) => {
  const result=reader({id,headword});
  expect(result.status).toBe('ready');
  if(result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson,{id,headword}).ok).toBe(true);
  expect(result.lesson.senses.some(s=>s.title === title&&s.examples.length>=2)).toBe(true);
});
