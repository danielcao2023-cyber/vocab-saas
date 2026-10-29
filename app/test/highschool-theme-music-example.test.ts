import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

it('shows a distinct music example while retaining existing theme examples', () => {
  const word = { id: 2874, headword: 'theme' };
  const result = createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  const sense = result.lesson.senses.find(s => s.id === 's1');
  expect(sense?.meaning).toContain('音乐作品中的主题旋律');
  expect(sense?.examples.map(e => e.id)).toEqual(['s1-e1', 's1-e2', 's1-music-example']);
});
