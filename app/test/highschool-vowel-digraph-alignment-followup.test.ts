import { expect, it } from 'vitest';
import { getSoundSpellingLessons } from '../web/src/content/sound-spelling';

it('groups weak ou in the reviewed -ous headwords', () => {
  for (const word of ['previous', 'various', 'religious', 'autonomous', 'precious', 'poisonous', 'numerous', 'enormous', 'nutritious', 'ambitious', 'tremendous', 'ridiculous']) {
    const lesson = getSoundSpellingLessons(word)[0];
    expect(lesson, word).toBeDefined();
    expect(lesson.chunks.flatMap(chunk => chunk.pairs).some(pair => pair.letters === 'ou' && pair.sound === '/ə/'), word).toBe(true);
    expect(lesson.chunks.map(chunk => chunk.letters).join(''), word).toBe(word);
  }
});

it('maps ti to /ʃ/ and the nutritious vowel to the cited long vowel', () => {
  for (const word of ['nutritious', 'ambitious']) {
    const lesson = getSoundSpellingLessons(word)[0];
    expect(lesson.chunks.flatMap(chunk => chunk.pairs).some(pair => pair.letters === 'ti' && pair.sound === '/ʃ/'), word).toBe(true);
  }
  const nutritious = getSoundSpellingLessons('nutritious')[0];
  expect(nutritious.ipa).toBe('/nuːˈtrɪʃəs/');
  expect(nutritious.uk).toBe('/njuːˈtrɪʃəs/');
  expect(nutritious.chunks[0].sound).toBe('/nuː/');
});

it('keeps the spelling groups together in Halloween and airline', () => {
  const halloween = getSoundSpellingLessons('Halloween')[0];
  expect(halloween.chunks.map(chunk => chunk.letters).join('')).toBe('Halloween');
  expect(halloween.chunks[1].pairs).toEqual([{ letters: 'ow', sound: '/oʊ/' }]);
  expect(halloween.chunks[2].stress).toBe('primary');
  const airline = getSoundSpellingLessons('airline')[0];
  expect(airline.chunks[0].pairs).toEqual([{ letters: 'air', sound: '/er/' }]);
});

it('treats final ue as a spelling group in reviewed headwords', () => {
  for (const [word, sound] of Object.entries({ statue: '/uː/', issue: '/uː/', tissue: '/uː/', venue: '/juː/', barbecue: '/juː/', pursue: '/uː/', virtue: '/uː/' })) {
    const lesson = getSoundSpellingLessons(word)[0];
    expect(lesson.chunks.map(chunk => chunk.letters).join('').toLowerCase(), word).toBe(word);
    expect(lesson.chunks.flatMap(chunk => chunk.pairs).some(pair => pair.letters === 'ue' && pair.sound === sound), word).toBe(true);
  }
});

it('preserves meaningful spelling groups for the remaining reviewed candidates', () => {
  for (const [word, letters, sound] of [
    ['frontier', 'ier', '/ɪr/'], ['premier', 'ier', '/ɪr/'],
    ['rumour', 'our', '/ər/'], ['labour', 'our', '/ər/'],
    ['patience', 'tience', '/ʃəns/'],
  ]) {
    const lesson = getSoundSpellingLessons(word)[0];
    expect(lesson.chunks.map(chunk => chunk.letters).join(''), word).toBe(word);
    expect(lesson.chunks.flatMap(chunk => chunk.pairs).some(pair => pair.letters === letters && pair.sound === sound), word).toBe(true);
  }
});
