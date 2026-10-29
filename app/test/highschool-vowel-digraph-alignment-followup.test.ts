import { expect, it } from 'vitest';
import { getSoundSpellingLessons } from '../web/src/content/sound-spelling';

it('groups weak ou in the reviewed -ous headwords', () => {
  for (const word of ['previous', 'various', 'religious', 'autonomous', 'precious', 'poisonous']) {
    const lesson = getSoundSpellingLessons(word)[0];
    expect(lesson, word).toBeDefined();
    expect(lesson.chunks.flatMap(chunk => chunk.pairs).some(pair => pair.letters === 'ou' && pair.sound === '/ə/'), word).toBe(true);
    expect(lesson.chunks.map(chunk => chunk.letters).join(''), word).toBe(word);
  }
});
