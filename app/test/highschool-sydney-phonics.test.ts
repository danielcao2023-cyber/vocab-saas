import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('maps the ey spelling at the end of Sydney to /i/', () => {
  const lesson = getSoundSpellingLesson('Sydney');
  expect(lesson).toBeDefined();
  const pairs = lesson!.chunks.flatMap(chunk => chunk.pairs);
  expect(pairs).toContainEqual({ letters: 'ey', sound: '/i/' });
  expect(pairs.some(pair => pair.letters === 'e' && !pair.sound)).toBe(false);
  expect(lesson!.variantNote).toContain('ey');
  expect(lesson!.sources.some(source => source.url.includes('primaryenglish.education'))).toBe(true);
});
