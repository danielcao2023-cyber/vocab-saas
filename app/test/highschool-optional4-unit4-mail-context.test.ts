import {expect, it} from 'vitest';
import {createLessonReader, validateLesson} from '../server/src/lessons.ts';

it('makes the electronic-mail example unambiguous in both languages', () => {
  const identity = {id: 3959, headword: 'mail'};
  const result = createLessonReader('data/lessons')(identity);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('missing lesson');
  expect(validateLesson(result.lesson, identity).ok).toBe(true);
  const example = result.lesson.senses.flatMap(s => s.examples)
    .find(e => e.en.startsWith('She mailed the photos'));
  expect(example?.en).toMatch(/email attachments/);
  expect(example?.zh).toContain('邮件附件');
});
