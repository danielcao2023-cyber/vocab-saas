import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('provides reviewed sports lessons and spelling guidance for Unit 3', () => {
  const read = createLessonReader();
  for (const [index, headword] of ['fitness', 'soccer', 'stadium'].entries()) {
    expect(read({ id: 1748 + index, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});
