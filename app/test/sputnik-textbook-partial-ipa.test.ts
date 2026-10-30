import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
import { readFileSync } from 'node:fs';
import type { WordLesson } from '../shared/lesson.ts';
it('shows textbook Sputnik pronunciation separately from number 1', () => {
 const word = { id: 1, headword: 'Sputnik 1' }, result = createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual(['Sputnik 部分：/ˈspʌtnɪk/', '', '']);
 expect(result.lesson.takeaway).toContain('不含编号 1');
 expect(result.lesson.forms[0].ipa).toBe(result.lesson.pronunciation.ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
});
it('attributes the printed textbook variant correctly and preserves dictionary variants', () => {
 const d: WordLesson=JSON.parse(readFileSync('data/lessons/2596.json','utf8'));
 expect(d.pronunciation.ipa).toBe('/ˈspʊtnɪk/ 或 /ˈspʌtnɪk/');
 expect(d.sources.find(s => s.id === 'textbook-pronunciation')?.supports).toContain('教材读音 /ˈspʌtnɪk/');
});
