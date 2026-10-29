import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('treats the doubled t in cigarette as one sound, with only the final e silent', () => {
  const lesson = getSoundSpellingLesson('cigarette');
  expect(lesson).toBeDefined();
  const ending = lesson!.chunks.find(chunk => chunk.letters === 'rette');
  expect(ending?.pairs).toEqual([
    { letters: 'r', sound: '/r/' }, { letters: 'e', sound: '/e/' },
    { letters: 'tt', sound: '/t/' }, { letters: 'e', sound: '' },
  ]);
  expect(lesson!.sources.some(source => source.url === 'https://dictionary.cambridge.org/pronunciation/english/cigarette')).toBe(true);
});
