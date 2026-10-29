import fs from 'node:fs';
import { expect, it } from 'vitest';
import { validateLesson } from '../server/src/lessons';
it.each([[4073, ['编织', '连接']], [4078, ['笼子', '关进笼子']]] as const)('%i distinguishes meanings', (id, titles) => {
  const lesson = JSON.parse(fs.readFileSync(`data/lessons/${id}.json`, 'utf8'));
  const indices = titles.map(title => lesson.senses.findIndex((sense: {title:string}) => sense.title.includes(title)));
  expect(indices.every(index => index >= 0)).toBe(true);
  expect(new Set(indices).size).toBe(titles.length);
  const result = validateLesson(lesson, {id, headword:lesson.headword});
  expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true);
});
