import fs from 'node:fs';
import { expect, it } from 'vitest';
import { validateLesson } from '../server/src/lessons';

it.each([[3941, ['利用', '功绩']], [3958, ['果酱', '堵塞', '卡住']]] as const)('%i separates common meanings', (id, titles) => {
  const lesson = JSON.parse(fs.readFileSync(`data/lessons/${id}.json`, 'utf8'));
  const indices = titles.map(title => lesson.senses.findIndex((sense: { title: string }) => sense.title.includes(title)));
  expect(indices.every(index => index >= 0)).toBe(true);
  expect(new Set(indices).size).toBe(titles.length);
  const result = validateLesson(lesson, { id, headword: lesson.headword });
  expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true);
});
it('shows exploit noun and verb pronunciations in separate forms', () => {
  const lesson = JSON.parse(fs.readFileSync('data/lessons/3941.json', 'utf8'));
  expect(lesson.forms.some((form: {label:string,ipa:string}) => form.label.includes('动词') && form.ipa === '/ɪkˈsplɔɪt/')).toBe(true);
  expect(lesson.forms.some((form: {label:string,ipa:string}) => form.label.includes('名词') && form.ipa === '/ˈeksplɔɪt/')).toBe(true);
});
