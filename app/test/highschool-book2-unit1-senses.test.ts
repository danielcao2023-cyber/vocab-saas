import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('explains the textbook cease-to-exist sense of disappear', () => {
  const word = { id: 1942, headword: 'disappear' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1942.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('不复存在'));
  expect(sense?.examples.some(e => e.en.includes('languages') && e.zh.includes('语言'))).toBe(true);
  expect(sense?.sourceIds).toContain('disappear-existence-source');
});
