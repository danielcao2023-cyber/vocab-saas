import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('reads sourced textbook meanings for five stable word identities', () => {
 const rows = [
  [1753,'come along','到达；出现'],[1754,'track','足迹；踪迹'],
  [1763,'championship','冠军称号'],[1765,'apart','分成碎片；散开'],
  [1775,'give up','投降；自首']
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
