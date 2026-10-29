import fs from 'node:fs';
import { expect, it } from 'vitest';
import { validateLesson } from '../server/src/lessons';
it('distinguishes contract senses and noun and verb pronunciations', () => {
  const lesson = JSON.parse(fs.readFileSync('data/lessons/4002.json', 'utf8'));
  const ids = ['合同', '收缩', '感染'].map(title => lesson.senses.findIndex((sense: {title:string}) => sense.title.includes(title)));
  expect(ids.every(id => id >= 0)).toBe(true);
  expect(new Set(ids).size).toBe(3);
  expect(lesson.forms.some((form: {label:string,ipa:string}) => form.label.includes('动词') && form.ipa === '/kənˈtrækt/')).toBe(true);
  expect(lesson.forms.some((form: {label:string,ipa:string}) => form.label.includes('名词') && form.ipa === '/ˈkɑːntrækt/')).toBe(true);
  const result = validateLesson(lesson, {id:4002,headword:'contract'});
  expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true);
});
