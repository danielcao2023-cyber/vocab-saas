import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createLessonReader, defaultLessonDir, validateLesson } from '../server/src/lessons';

it('validates and serves sourced pronunciations of complete phrases', () => {
  const cases = [
    [2063, 'search engine', '/ˈsɜːtʃ ˌendʒɪn/', '/ˈsɝːtʃ ˌendʒɪn/'],
    [2307, 'Christmas carol', '/ˌkrɪsməs ˈkærəl/', '/ˌkrɪsməs ˈkerəl/'],
    [2066, 'identity card', '/aɪˈdentəti kɑːd/', '/aɪˈdentəti kɑːrd/'],
    [1944, 'make sure', '/meɪk ʃɔː/', ''],
    [2013, 'under pressure', '/ˌʌndə ˈpreʃə/', ''],
  ] as const;
  const read = createLessonReader();
  for (const [id, headword, uk, us] of cases) {
    const word = { id, headword };
    const raw = JSON.parse(readFileSync(join(defaultLessonDir, `${id}.json`), 'utf8'));
    expect(validateLesson(raw, word).ok, headword).toBe(true);
    const response = read(word);
    expect(response.status, headword).toBe('ready');
    expect(response.lesson?.pronunciation).toMatchObject({uk, us, sourceIds:['pronunciation-phrase']});
  }
});
