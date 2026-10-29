import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createLessonReader, defaultLessonDir, validateLesson } from '../server/src/lessons';

it('validates and reads the sourced Thanksgiving Day pronunciations', () => {
  const word = { id: 2345, headword: 'Thanksgiving Day' };
  const raw = JSON.parse(readFileSync(join(defaultLessonDir, '2345.json'), 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  expect(result.lesson?.pronunciation).toMatchObject({
    uk: '/θæŋksˈɡɪvɪŋ ˌdeɪ/', us: '/θæŋksˌɡɪvɪŋ ˈdeɪ/'
  });
  expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');
});
