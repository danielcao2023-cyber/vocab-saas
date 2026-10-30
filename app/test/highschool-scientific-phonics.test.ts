import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('maps scientific’s sc to one /s/ sound without marking c silent', () => {
  const lesson = getSoundSpellingLesson('scientific');
  expect(lesson).toBeDefined();
  const pairs = lesson!.chunks.flatMap(chunk => chunk.pairs);
  expect(pairs).toContainEqual({ letters: 'sc', sound: '/s/' });
  expect(pairs.some(pair => pair.letters === 'c' && !pair.sound)).toBe(false);
  expect(lesson!.sources.some(source => source.url.includes('publishing.service.gov.uk'))).toBe(true);
});
