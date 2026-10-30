import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const cases = [
 [3126, 'non-Newtonian fluid', 'fluid 单独读作 /ˈfluː.ɪd/', '不包含 non-Newtonian', 'fluid'],
 [1, 'geothermal park', 'geothermal 单独读作英式 /ˌdʒiː.əʊˈθɜː.məl/、美式 /ˌdʒiː.oʊˈθɝː.məl/', '不包含 park', 'geothermal'],
 [2372, 'resident physician', 'physician 单独读作 /fɪˈzɪʃ.ən/', '不包含 resident', 'physician'],
 [3371, 'IV needle', 'IV 读作 /ˌaɪˈviː/', '不包含 needle', 'iv'],
] as const;
for (const [id, headword, partial, scope, source] of cases) {
 it(`明确 ${headword} 的局部读音`, () => {
  const word={id, headword}, result=createLessonReader('data/lessons')(word);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson,word).ok).toBe(true);
  expect(result.lesson.takeaway).toContain(partial);
  expect(result.lesson.takeaway).toContain(scope);
  expect(result.lesson.pronunciation.ipa).toBe('');
  expect(result.lesson.forms[0].ipa).toBe('');
  expect(result.lesson.sources.some(s=>s.url.includes(`/pronunciation/english/${source}`))).toBe(true);
 });
}
