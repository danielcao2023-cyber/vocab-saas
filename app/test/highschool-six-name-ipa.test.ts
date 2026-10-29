import {expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createLessonReader, defaultLessonDir, validateLesson} from '../server/src/lessons';
import {join} from 'node:path';

it('serves sourced UK and US pronunciations for six names', () => {
  const read = createLessonReader();
  for (const [id, headword, uk, us] of [
    [1736, 'Disneyland', '/ˈdɪznilænd/', '/ˈdɪznilænd/'],
    [2344, 'Thanksgiving', '/ˌθæŋksˈɡɪvɪŋ/', '/ˌθæŋksˈɡɪvɪŋ/'],
    [3322, 'Vancouver', '/vænˈkuːvə/', '/vænˈkuːvɚ/'],
    [3325, 'Toronto', '/təˈrɒntəʊ/', '/təˈrɑːnt̬oʊ/'],
    [3328, 'Ontario', '/ɒnˈteəriəʊ/', '/ɑːnˈterioʊ/'],
    [3745, 'Shakespeare', '/ˈʃeɪkspɪə/', '/ˈʃeɪkspɪr/'],
  ] as const) {
    const identity = {id, headword};
    const raw = JSON.parse(readFileSync(join(defaultLessonDir, `${id}.json`), 'utf8'));
    expect(validateLesson(raw, identity).ok, headword).toBe(true);
    const response = read(identity);
    expect(response.status, headword).toBe('ready');
    expect(response.lesson?.pronunciation).toMatchObject({uk, us, sourceIds:['pronunciation-cambridge']});
  }
});
