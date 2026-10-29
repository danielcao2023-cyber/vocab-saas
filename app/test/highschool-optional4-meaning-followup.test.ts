import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('reads six sourced textbook meanings for the same word identities', () => {
 const rows = [
  [3794,'leather','皮衣；皮制服装（复数）'],[3806,'pace','调整自己的节奏'],
  [3796,'panel','专家咨询组'],[3785,'alien','外国人；非本国公民'],
  [3812,'random','奇怪的；令人意外的'],[3813,'maximum','最大量；最大限度（名词）']
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,title] of rows){
  const word={id,headword};
  const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));
  const valid=validateLesson(raw,word);
  expect(valid,`${headword}: ${JSON.stringify(valid)}`).toMatchObject({ok:true});
  const result=read(word);expect(result.status,headword).toBe('ready');
  expect(result.lesson?.senses.find(s=>s.title===title)?.examples.length,headword).toBeGreaterThanOrEqual(2);
 }
});
