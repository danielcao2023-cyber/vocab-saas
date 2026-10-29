import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads five sourced textbook meanings and examples', () => {
 const rows = [
  [1939,'conduct','组织方式；管理方法（名词）','The committee reviewed the conduct of the election.'],
  [1958,'forgive','请原谅；对不起','Forgive me for asking, but where did you buy the book?'],
  [1999,'mass','大量；众多','A mass of rocks blocked the narrow road.'],
  [1949,'entrance','进入；入场','The actor made an entrance in the second scene.'],
  [1947,'professional','职业选手','She became a professional after years of tennis training.']
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,title,en] of rows){
  const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));
  const valid=validateLesson(raw,word);expect(valid,`${headword}: ${JSON.stringify(valid)}`).toMatchObject({ok:true});
  const result=read(word);expect(result.status,headword).toBe('ready');
  expect(result.lesson?.senses.find(s=>s.title===title)?.examples.some(e=>e.en===en),headword).toBe(true);
 }
});
