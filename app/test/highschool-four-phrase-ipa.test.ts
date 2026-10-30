import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';

const read = createLessonReader('data/lessons');

it.each([
  [1744, 'Cusco', '/ˈkuː.skəʊ/', '/ˈkuː.skoʊ/'],
  [1846, 'Memphis', '/ˈmemfɪs/', '/ˈmemfɪs/'],
  [2600, 'Neil Armstrong', '/ˌniːl ˈɑːmstrɒŋ/', '/ˌniːl ˈɑːrmstrɔːŋ/'],
  [3128, 'Stephen Hawking', '/ˌstiːvn ˈhɔːkɪŋ/', '/ˌstiːvn ˈhɔːkɪŋ/'],
  [3820, 'Isaac Asimov', '/ˌaɪzək ˈæzɪmɒf/', '/ˌaɪzək ˈæzɪmɑːf/'],
  [3748, 'Elizabeth Barrett Browning', '/ɪˌlɪzəbəθ ˌbærət ˈbraʊnɪŋ/', '/ɪˌlɪzəbəθ ˌbærət ˈbraʊnɪŋ/'],
  [3752, 'Langston Hughes', '/ˌlæŋkstən ˈhjuːz/', '/ˌlæŋkstən ˈhjuːz/'],
  [2180, 'Van Gogh', '/vænˈɡɒf/', '/vænˈɡoʊ/'],
  [3483, 'Michelangelo', '/ˌmaɪkəlˈændʒələʊ/', '/ˌmaɪkəlˈændʒəloʊ/'],
] as const)('reads sourced proper-name pronunciations for %s', (id, headword, uk, us) => {
  const word = { id, headword };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.uk).toBe(uk);
  expect(result.lesson.pronunciation.us).toBe(us);
});

it('reads the sourced British full form pronunciation of GPS', () => {
  const word = { id: 2612, headword: 'global positioning system' };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.uk).toBe('/ˌɡləʊbl pəˈzɪʃənɪŋ sɪstəm/');
  expect(result.lesson.pronunciation.us).toBe('');
  expect(result.lesson.sources.find(source => source.id === 'phrase-oxford')?.url).toBe('https://www.oxfordlearnersdictionaries.com/us/definition/english/global-positioning-system');
});

it.each([
  [2318, 'to be frank', '/tə bɪ ˈfræŋk/'],
  [2007, 'concerned about', '/kənˈsɜːnd əbaʊt/'],
  [2425, 'a great deal of', '/ə ɡreɪt ˈdiːl ɒv/'],
  [2738, 'come to power', '/kʌm tə ˈpaʊə/'],
] as const)(
  'reads the sourced British phrase pronunciation for %s', (id, headword, ipa) => {
    const word = { id, headword };
    const result = read(word);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('missing lesson');
    expect(validateLesson(result.lesson, word).ok).toBe(true);
    expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, ipa, '']);
    expect(result.lesson.pronunciation.accentNote).toContain('美式');
    expect(result.lesson.sources.some(source => source.id === 'phrase-reference')).toBe(true);
  },
);

it('shows the sourced British pronunciation of on earth in a question', () => {
  const word = { id: 1992, headword: 'on earth' };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.uk).toBe('/ɒn ɜːθ/');
  expect(result.lesson.pronunciation.us).toBe('');
  expect(result.lesson.sources.find(source => source.id === 'phrase-uk')?.url).toContain('9781316628317_index.pdf');
});

it('reads the complete watch over transcription without inventing stress marks', () => {
  const word = { id: 2028, headword: 'watch over' };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect(result.lesson.pronunciation.us).toBe('/wɑtʃ oʊvəɹ/');
  expect(result.lesson.pronunciation.uk).toBe('/wɒtʃ əʊvə/');
  expect(result.lesson.pronunciation.accentNote).toContain('原词典未标重音');
  expect(result.lesson.sources.find(source => source.id === 'phrase-pronunciation')?.url).toBe('https://www.spanishdict.com/pronunciation/watch%20over');
});

it('reads the complete dictionary pronunciation of up to, preserving context note', () => {
  const word = { id: 2893, headword: 'up to' };
  const result = read(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, word).ok).toBe(true);
  expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['/ˈʌp ˌtuː/', '/ˈʌp ˌtuː/', '/ˈʌp ˌtuː/']);
  expect(result.lesson.pronunciation.accentNote).toContain('弱读');
  expect(result.lesson.sources.find(source => source.id === 'reference')?.url).toBe('https://dictionary.cambridge.org/dictionary/english/up-to');
});
