import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('recognizes shore as both countable and uncountable',()=>{
  const lesson = JSON.parse(readFileSync(new URL('../data/lessons/3307.json',import.meta.url),'utf8'));
  expect(lesson.senses[0].usageNote).toContain('可数');
  expect(lesson.senses[0].usageNote).toContain('不可数');
  expect(lesson.sources.some((s:{url:string})=>s.url==='https://dictionary.cambridge.org/dictionary/english/shore')).toBe(true);
});
