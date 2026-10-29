import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createLessonReader, defaultLessonDir, validateLesson } from '../server/src/lessons';

it('validates and serves sourced pronunciations for Canadian places', () => {
  const cases = [
    [1847, 'Alberta', '/ælˈbɜːtə/', '/ælˈbɝːt̬ə/'],
    [3321, 'Halifax', '/ˈhælɪfæks/', '/ˈhælɪfæks/'],
    [3324, 'Jasper', '', '/ˈdʒæspər/'],
    [3326, 'Edmonton', '/ˈedməntən/', '/ˈedməntən/'],
    [3327, 'Winnipeg', '/ˈwɪnɪpeɡ/', '/ˈwɪnɪpeɡ/'],
    [3331, 'Montreal', '/ˌmɒntriˈɔːl/', '/ˌmɑːntriˈɔːl/'],
  ] as const;
  const read = createLessonReader();
  for (const [id, headword, uk, us] of cases) {
    const identity = { id, headword };
    const raw = JSON.parse(readFileSync(join(defaultLessonDir, `${id}.json`), 'utf8'));
    expect(validateLesson(raw, identity).ok, headword).toBe(true);
    const result = read(identity);
    expect(result.status, headword).toBe('ready');
    expect(result.lesson?.pronunciation).toMatchObject({ uk, us });
    expect(result.lesson?.pronunciation.sourceIds).not.toEqual([]);
  }
});
