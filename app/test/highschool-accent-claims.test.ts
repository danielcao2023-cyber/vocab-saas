import { expect, it } from 'vitest';
import { getSoundSpellingLessons } from '../web/src/content/sound-spelling';

it('explains princess stress variants without presenting them as accent-exclusive', () => {
  const lesson = getSoundSpellingLessons('prince / princess').find(item => item.headword === 'princess');
  expect(lesson).toBeDefined();
  expect(lesson!.ipa).toBe('/ˈprɪn.ses/');
  expect(lesson!.variantNote).toContain('英美读法也都可重读第二音节');
  expect(lesson!.sources.some(source => source.url === 'https://dictionary.cambridge.org/pronunciation/english/princess')).toBe(true);
});

it('uses the published whole-phrase British pronunciation for be attracted to', () => {
  const lesson = getSoundSpellingLessons('be attracted to')[0];
  expect(lesson.uk).toBe('/bi əˈtræktɪd tə/');
  expect(lesson.ipa.replaceAll(' ', '')).toBe(lesson.uk?.replaceAll(' ', ''));
  expect(lesson.chunks.map(chunk => chunk.letters).join('')).toBe('be attracted to');
  expect(lesson.sources.some(source => source.label.includes('完整搭配英式读音'))).toBe(true);
});

it('describes reviewed secondary-stress chunks consistently', () => {
  for (const word of ['underwater', 'leftover', 'disability', 'consultation', 'hypothetical', 'entrepreneur', 'intermediate']) {
    const lesson = getSoundSpellingLessons(word)[0];
    const chunk = lesson.chunks.find(item => item.stress === 'secondary');
    expect(chunk, word).toBeDefined();
    expect(chunk!.hint, word).toBe('此部分次重读。');
    expect(chunk!.tip, word).toBe('此部分次重读。');
  }
});

it('attributes the Renoir accent variants to the checked dictionary', () => {
  const lesson = getSoundSpellingLessons('Renoir')[0];
  expect(lesson.ipa).toBe('/rənˈwɑːr/');
  expect(lesson.uk).toBe('/ˈrenwɑː/');
  expect(lesson.variantNote).toContain('美式另有前重音变体');
  expect(lesson.sources.some(source => source.url === 'https://www.collinsdictionary.com/dictionary/english/renoir')).toBe(true);
});
