import { expect, it } from 'vitest';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';

it('shows the Cambridge secondary stress in millimetre alongside the primary stress', () => {
  const lesson = getSoundSpellingLesson('millimetre')!;
  expect(lesson.ipa).toBe('/ˈmɪləˌmiːtər/');
  expect(lesson.uk).toBe('/ˈmɪlɪˌmiːtə/');
  expect(lesson.chunks.find(chunk => chunk.letters === 'mill')?.stress).toBe('primary');
  expect(lesson.chunks.find(chunk => chunk.letters === 'me')?.stress).toBe('secondary');
});
