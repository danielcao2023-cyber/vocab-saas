import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
it('includes the textbook currency exchange use of exchange', () => {
  const word = { id: 1601, headword: 'exchange' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1601.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('兑换'));
  expect(sense?.examples.some(e => e.en.includes('exchange') && e.zh.includes('兑换'))).toBe(true);
  expect(sense?.sourceIds).toContain('exchange-currency-source');
});

it('covers flashing lights as a signal', () => {
  const word = { id: 1635, headword: 'flash' };
  const raw = JSON.parse(fs.readFileSync('data/lessons/1635.json', 'utf8'));
  expect(validateLesson(raw, word).ok).toBe(true);
  const result = createLessonReader()(word);
  expect(result.status).toBe('ready');
  const sense = result.lesson?.senses.find(s => s.title.includes('动词'));
  expect(sense?.examples.some(e => e.en.includes('flashed') && e.zh.includes('示意'))).toBe(true);
  expect(sense?.sourceIds).toContain('flash-signal-source');
});
