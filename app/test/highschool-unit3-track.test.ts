import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';

it('provides reviewed Unit 3 track-and-field vocabulary', () => {
  const read = createLessonReader();
  for (const [id, headword] of [[1754, 'track'], [1755, 'track and field'], [1756, 'gymnastics'], [1760, 'legend']] as const) {
    expect(read({ id, headword }).status, headword).toBe('ready');
  }
  for (const word of ['track', 'gymnastics', 'legend']) expect(getSoundSpellingLesson(word), word).toBeDefined();
});
