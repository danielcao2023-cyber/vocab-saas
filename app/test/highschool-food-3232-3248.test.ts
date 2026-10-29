import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const read = (id: number) => JSON.parse(readFileSync(new URL(`../data/lessons/${id}.json`, import.meta.url), 'utf8'));

it('gives bean curd separate dictionary-backed UK and US pronunciations', () => {
  const lesson = read(3232);
  expect(lesson.pronunciation.uk).toBe('/ˈbiːn ˌkɜːd/');
  expect(lesson.pronunciation.us).toBe('/ˈbiːn ˌkɜːrd/');
  expect(lesson.forms[0].ipa).toBe(lesson.pronunciation.us);
  expect(lesson.sources.some((source: {url:string}) => source.url.includes('/pronunciation/english/bean-curd'))).toBe(true);
});

it('distinguishes a nutritional calorie from the small calorie in the kilocalorie conversion', () => {
  const lesson = read(3248);
  expect(lesson.takeaway).toContain('小卡');
  expect(lesson.wordFamily[0].formation).toContain('小卡');
  expect(lesson.confusions[0].items[1].example.zh).toContain('小卡');
  expect(lesson.confusions[0].takeaway).toContain('食品营养');
});
