import {expect, it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';

it('shows the complete sourced Wi-Fi spelling and sound mapping', () => {
 const lesson = getSoundSpellingLessons('Wi-Fi')[0];
 expect(lesson).toBeDefined();
 expect(lesson.ipa).toBe('/ˈwaɪ.faɪ/');
 expect(lesson.chunks.map(chunk => chunk.letters).join('')).toBe('Wi-Fi');
 expect(lesson.chunks.map(chunk => chunk.pairs.map(pair => pair.letters).join(''))).toEqual(lesson.chunks.map(chunk => chunk.letters));
 expect(lesson.chunks.flatMap(chunk => chunk.pairs.map(pair => pair.sound))).toEqual(['/w/', '/aɪ/', '', '/f/', '/aɪ/']);
 expect(lesson.chunks.map(chunk => chunk.stress)).toEqual(['primary', 'none']);
 expect(lesson.sources.some(source => source.url.includes('dictionary.cambridge.org/pronunciation/english/wi-fi'))).toBe(true);
});
