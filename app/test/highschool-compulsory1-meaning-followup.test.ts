import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';

it('validates and reads textbook senses with examples for the same stable word identities', () => {
 const rows = [
  [1663,'advance','前进；促进（动词）','Medical science has advanced rapidly in recent years.'],
  [1674,'survival','幸存事物；遗存','The festival is a survival from an earlier age.'],
  [1720,'credit','称赞；认可','The whole team deserves credit for the project.'],
  [1725,'request','请求；要求（名词）','The teacher accepted their request for extra time.'],
  [1701,'flight','航班；航程','Our flight to Beijing took two hours.'],
 ] as const;
 const read=createLessonReader();
 for (const [id,headword,title,en] of rows) {
  const word={id,headword};
  const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));
  const validation=validateLesson(raw,word);
  expect(validation,headword).toMatchObject({ok:true});
  const result=read(word);
  expect(result.status,headword).toBe('ready');
  expect(result.lesson?.senses.find(s=>s.title===title)?.examples.some(e=>e.en===en),headword).toBe(true);
 }
});
