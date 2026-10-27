import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('provides lessons and sound-spelling guidance for the next Unit 2 words', () => {
  const words = ['arrangement', 'extremely', 'source', 'powerful', 'empire'];
  for (const [index, headword] of words.entries()) {
    expect(createLessonReader()({ id: 1691 + index, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});
