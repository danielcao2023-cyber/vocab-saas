import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('includes the harm-to-reputation sense of injure', () => {
  const word = { id: 1767, headword: 'injure' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1767.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('声誉'));
  expect(sense?.examples.some(e => e.en.includes('reputation') && e.zh.includes('声誉'))).toBe(true);
  expect(sense?.sourceIds).toContain('injure-reputation-source');
});
