import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('retains the textbook phonetics for range from … to … with unspoken slots', () => {
  const word = { id: 2267, headword: 'range from ... to ...' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/reɪndʒ frəm ... tuː/', '', '']);
  expect(result.lesson.pronunciation.sourceIds).toContain('phrase-pronunciation');
  expect(result.lesson.sources.find(x => x.id === 'phrase-pronunciation')?.url).toBe('https://www.eltngl.com/sites/sites/default/files/documents/cu3e_b2plus_russian_sb_u01.pdf');
});
