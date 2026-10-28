import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';
it('provides reviewed Unit 3 competition and injury lessons', () => {
  const read = createLessonReader();
  for (const [id, headword] of [[1763, 'championship'], [1764, 'determination'], [1765, 'apart'], [1766, 'fall apart'], [1767, 'injure'], [1768, 'injured']] as const) expect(read({ id, headword }).status, headword).toBe('ready');
  for (const word of ['championship', 'apart', 'injure', 'injured']) expect(getSoundSpellingLesson(word), word).toBeDefined();
});
