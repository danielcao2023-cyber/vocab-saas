import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('reads sourced textbook meanings for the same five word identities', () => {
 const rows = [
  [2691,'vital','充满生机的'],[2701,'extract','提取物（名词）'],
  [2704,'obtain','存在；流行'],[2721,'flow','流动；持续供应（名词）'],
  [2732,'patent','受专利保护的（形容词）']
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
