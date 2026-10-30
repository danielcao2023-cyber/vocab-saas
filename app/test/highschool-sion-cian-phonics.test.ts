import {expect, it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';
const cases = [
  ['occasion','sion','/ʒən/'], ['tension','sion','/ʃən/'], ['conclusion','sion','/ʒən/'],
  ['envision','sion','/ʒən/'], ['vision','sion','/ʒən/'], ['physician','cian','/ʃən/'],
  ['politician','cian','/ʃən/'], ['make an impression','ssion','/ʃən/'],
] as const;
it.each(cases)('groups %s spelling %s according to its documented sound %s', (word, letters, sound) => {
  const chunk = getSoundSpellingLesson(word)?.chunks.find(chunk => chunk.letters === letters && chunk.sound === sound);
  expect(chunk).toBeDefined();
  expect(chunk!.pairs).toEqual([{letters, sound}]);
});
