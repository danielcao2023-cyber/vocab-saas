import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('explains American stress variants without assigning them to a single part of speech', () => {
  const word = { id: 3093, headword: 'concrete' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.notes.join(' ')).toContain('名词和形容词都可首音节重读或第二音节重读');
  expect(result.lesson.pronunciation.notes.join(' ')).toContain('音形对照展示首音节重读');
  expect(result.lesson.forms[0].note).toContain('美式英语');
});
