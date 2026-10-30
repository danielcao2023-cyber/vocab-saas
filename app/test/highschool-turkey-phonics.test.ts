import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('teaches the ey spelling of the final /i/ in turkey', () => {
  const lesson = getSoundSpellingLesson('turkey');
  expect(lesson).toBeDefined();
  const pairs = lesson!.chunks.flatMap(chunk => chunk.pairs);
  expect(pairs).toContainEqual({ letters: 'ey', sound: '/i/' });
  expect(pairs.some(pair => pair.letters === 'e' && !pair.sound)).toBe(false);
  expect(lesson!.sources.some(source => source.url.includes('tabinfant.org.uk'))).toBe(true);
});
