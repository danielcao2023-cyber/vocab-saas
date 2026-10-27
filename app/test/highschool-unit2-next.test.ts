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

it('provides reviewed Unit 2 lessons and spelling guidance for the travel vocabulary', () => {
  const words = ['site', 'take control of', 'official', 'recognize', 'type', 'flight', 'accommodation', 'unique', 'path', 'destination'];
  const read = createLessonReader();
  for (const [index, headword] of words.entries()) {
    expect(read({ id: 1696 + index, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});
