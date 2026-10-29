import {describe, expect, it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';

describe('Napa Valley sound-spelling', () => {
  it('returns the complete dictionary pronunciation and spelling through actual lookup', () => {
    const lessons = getSoundSpellingLessons('Napa Valley');
    expect(lessons).toHaveLength(1);
    expect(lessons[0].ipa).toBe('/ˌnæpəˈvæli/');
    expect(lessons[0].chunks.map(chunk => chunk.letters).join('')).toBe('Napa Valley');
    expect(lessons[0].chunks.map(chunk => chunk.stress)).toEqual(['secondary', 'none', 'primary']);
  });
});
