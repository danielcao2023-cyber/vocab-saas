import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';
it('provides reviewed Unit 3 glory and example lessons', () => {
  const read = createLessonReader();
  for (const [id, headword] of [[1761, 'set an example'], [1762, 'glory']] as const) expect(read({ id, headword }).status, headword).toBe('ready');
  expect(getSoundSpellingLesson('glory')).toBeDefined();
});
