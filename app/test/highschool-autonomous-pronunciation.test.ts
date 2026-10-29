import { expect, it } from 'vitest';
import { getSoundSpellingLessons } from '../web/src/content/sound-spelling';

it('shows a consistent British autonomous mapping and explains American variants', () => {
  const lesson = getSoundSpellingLessons('autonomous')[0];
  expect(lesson.ipa).toBe('/ɔːˈtɒnəməs/');
  expect(lesson.uk).toBe(lesson.ipa);
  expect(lesson.chunks.map(chunk => chunk.letters).join('')).toBe('autonomous');
  expect(lesson.chunks[1].sound).toBe('/tɒ/');
  expect(lesson.chunks[1].pairs.find(pair => pair.letters === 'o')?.sound).toBe('/ɒ/');
  expect(lesson.variantNote).toContain('/ɑːˈtɑːnəməs/');
});
