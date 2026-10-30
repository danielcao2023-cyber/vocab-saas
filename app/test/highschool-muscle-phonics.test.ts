import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('maps muscle’s sc together to a single /s/ sound', () => {
  const lesson = getSoundSpellingLesson('muscle');
  expect(lesson).toBeDefined();
  const pairs = lesson!.chunks.flatMap(chunk => chunk.pairs);
  expect(pairs).toContainEqual({ letters: 'sc', sound: '/s/' });
  expect(pairs.some(pair => pair.letters === 'c' && !pair.sound)).toBe(false);
  expect(lesson!.variantNote).toContain('sc');
  expect(lesson!.sources.some(source => source.url.includes('education.nsw.gov.au'))).toBe(true);
});
