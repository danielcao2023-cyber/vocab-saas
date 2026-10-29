import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';

it('explains the textbook verb sense of approach through the actual reader', () => {
  const word = { id: 2149, headword: 'approach' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/2149.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('处理'));
  expect(sense?.examples.some(e => /approach.*problem/i.test(e.en))).toBe(true);
  expect(sense?.sourceIds).toContain('approach-deal-source');
});

it('explains the literary activity-domain sense of kingdom', () => {
  const word = { id: 2121, headword: 'kingdom' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/2121.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('领域'));
  expect(sense?.usageNote).toContain('文学');
  expect(sense?.examples.some(e => e.en.includes('kingdom of'))).toBe(true);
  expect(sense?.sourceIds).toContain('kingdom-domain-source');
});
