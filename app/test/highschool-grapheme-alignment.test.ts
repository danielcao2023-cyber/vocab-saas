import { describe, expect, it } from 'vitest';
import { getSoundSpellingLessons } from '../web/src/content/sound-spelling';

describe('Buddhist and Buddhism sound-spelling alignment', () => {
  it.each(['Buddhist', 'Buddhism'])('%s groups ddh as one /d/ spelling', (word) => {
    const lesson = getSoundSpellingLessons(word)[0];
    expect(lesson).toBeDefined();
    expect(lesson.chunks.map((chunk) => chunk.letters).join('')).toBe(word);
    const pairs = lesson.chunks.flatMap((chunk) => chunk.pairs);
    expect(pairs).toContainEqual({ letters: 'ddh', sound: '/d/' });
    expect(pairs).not.toContainEqual({ letters: 'dh', sound: '' });
    for (const chunk of lesson.chunks) {
      expect(chunk.pairs.map((pair) => pair.letters).join('')).toBe(chunk.letters);
      expect(chunk.pairs.map((pair) => pair.sound.replaceAll('/', '')).join(''))
        .toBe(chunk.sound.replaceAll('/', ''));
    }
  });
});

it('acknowledge groups dge as one /dʒ/ spelling', () => {
  const lesson = getSoundSpellingLessons('acknowledge')[0];
  const pairs = lesson.chunks.flatMap((chunk) => chunk.pairs);
  expect(pairs).toContainEqual({ letters: 'dge', sound: '/dʒ/' });
  expect(pairs).not.toContainEqual({ letters: 'd', sound: '' });
});
