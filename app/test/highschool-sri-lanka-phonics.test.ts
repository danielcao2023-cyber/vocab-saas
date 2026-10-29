import {expect, it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('maps the Oxford American pronunciation of Sri Lanka', () => {
  const lesson = getSoundSpellingLesson('Sri Lanka');
  expect(lesson?.ipa).toBe('/ˌsri ˈlɑŋkə/');
  expect(lesson?.chunks.map(chunk => chunk.letters).join('')).toBe('Sri Lanka');
  expect(lesson?.sources.some(source => source.url === 'https://www.oxfordlearnersdictionaries.com/us/definition/american_english/sri-lanka')).toBe(true);
});
