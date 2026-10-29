import { expect, it } from 'vitest';
import { getSoundSpellingLessons } from '../web/src/content/sound-spelling';

it('explains princess stress variants without presenting them as accent-exclusive', () => {
  const lesson = getSoundSpellingLessons('prince / princess').find(item => item.headword === 'princess');
  expect(lesson).toBeDefined();
  expect(lesson!.ipa).toBe('/ˈprɪn.ses/');
  expect(lesson!.variantNote).toContain('英美读法也都可重读第二音节');
  expect(lesson!.sources.some(source => source.url === 'https://dictionary.cambridge.org/pronunciation/english/princess')).toBe(true);
});
