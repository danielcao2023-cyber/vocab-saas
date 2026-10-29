import fs from 'node:fs';
import { expect, it } from 'vitest';
import { validateLesson } from '../server/src/lessons';

const cases = [[3888, ['孵化', '舱口']], [3889, ['容量', '能力']], [3891, ['围栏', '围住']]] as const;
it.each(cases)('%i provides separate validated common senses', (id, titles) => {
  const lesson = JSON.parse(fs.readFileSync(`data/lessons/${id}.json`, 'utf8'));
  const indices = titles.map(title => lesson.senses.findIndex((sense: {title: string}) => sense.title.includes(title)));
  expect(indices.every(index => index >= 0)).toBe(true);
  expect(new Set(indices).size).toBe(titles.length);
  const result = validateLesson(lesson, { id, headword: lesson.headword });
  expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true);
});
