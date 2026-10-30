import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it('retains Cambridge pronunciations of Portsmouth', () => {
  const word = { id: 2515, headword: 'Portsmouth' }, result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/ˈpɔːt.sməθ/', '/ˈpɔːt.sməθ/', '/ˈpɔːrt.sməθ/']);
  expect(result.lesson.sources.find(x => x.id === 'full-pronunciation')?.url).toBe('https://dictionary.cambridge.org/pronunciation/english/portsmouth');
  expect(result.lesson.pronunciation.sourceIds).toContain('full-pronunciation');
});
