import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('teaches sc together as the single /s/ sound in fascinating', () => {
  const lesson = getSoundSpellingLesson('fascinating');
  expect(lesson).toBeDefined();
  const pairs = lesson!.chunks.flatMap(chunk => chunk.pairs);
  expect(pairs).toContainEqual({ letters: 'sc', sound: '/s/' });
  expect(pairs.some(pair => pair.letters === 'c' && !pair.sound)).toBe(false);
  expect(lesson!.sources.some(source => source.url.includes('gov.uk') || source.url.includes('publishing.service.gov.uk'))).toBe(true);
});
