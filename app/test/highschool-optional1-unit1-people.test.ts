import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';

it('provides lessons for optional Book 1 Unit 1 names and SARS', () => {
  const read = createLessonReader();
  for (const [id, headword] of [
    [2753, 'Nobel Prize'], [2754, 'Albert Einstein'], [2755, 'Hitler'],
    [2756, 'Florence Nightingale'], [2757, 'SARS'], [2758, 'Switzerland'],
    [2759, 'Swiss'], [2760, 'Isaac Newton'], [2761, 'Jewish'], [2762, 'Princeton'],
  ] as const) expect(read({ id, headword }).status, headword).toBe('ready');
});
