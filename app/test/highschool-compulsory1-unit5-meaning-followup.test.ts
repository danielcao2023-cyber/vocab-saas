import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads five sourced textbook meanings and examples', () => {
 const rows = [
  [1858,'reference','指称；指称关系','The reference of the word depends on the context.'],
  [1859,'refer','转交；让……向……求助','The doctor referred the patient to a specialist.'],
  [1874,'major','主修（动词）','She majored in biology at university.'],
  [1884,'appreciate','增值','The house appreciated in value over ten years.'],
  [1898,'demand','强烈要求','“Who opened the gate?” the guard demanded.']
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,title,en] of rows){
  const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));
  const valid=validateLesson(raw,word);expect(valid,`${headword}: ${JSON.stringify(valid)}`).toMatchObject({ok:true});
  const result=read(word);expect(result.status,headword).toBe('ready');
  expect(result.lesson?.senses.find(s=>s.title===title)?.examples.some(e=>e.en===en),headword).toBe(true);
 }
});
