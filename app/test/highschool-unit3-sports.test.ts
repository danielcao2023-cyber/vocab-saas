import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';
import { createLessonReader } from '../server/src/lessons';

it('provides reviewed Unit 3 sports vocabulary and common phrases', () => {
  const readLesson = createLessonReader();
  for (const [id, headword] of [[1751, 'boxing'], [1752, 'marathon'], [1753, 'come along'], [1757, 'work out'], [1758, 'sweat'], [1759, 'make it']] as const) {
    expect(readLesson({ id, headword }).status, headword).toBe('ready');
  }
  for (const word of ['boxing', 'marathon', 'sweat']) expect(getSoundSpellingLesson(word), word).toBeDefined();
});
