import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader, validateLesson } from '../server/src/lessons';
for (const [id, headword, fragment, example, source] of [[2008,'living','日常生活','daily living','living-life-source'],[2011,'measure','评估','measure the success','measure-judge-source'],[2044,'net','互联网','the Net','net-internet-source']] as const) {
  it(`${headword} includes the textbook sense and an example`, () => {
    const word = { id, headword };
    const raw = JSON.parse(fs.readFileSync(`data/lessons/${id}.json`, 'utf8'));
    expect(validateLesson(raw, word).ok).toBe(true);
    const result = createLessonReader()(word);
    expect(result.status).toBe('ready');
    const sense = result.lesson?.senses.find(s => s.title.includes(fragment));
    expect(sense?.examples.some(e => e.en.includes(example))).toBe(true);
    expect(sense?.sourceIds).toContain(source);
  });
}
