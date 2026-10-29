import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons';

it('serves textbook-relevant senses for Unit 5 stable word identities',()=>{
 const read=createLessonReader();
 for(const [id,headword,title] of [[2651,'pursue','追赶；追逐'],[2654,'sequence','一系列相关事件或事物'],[2670,'plot','小块土地'],[2675,'maintain','坚持主张；坚称']] as const){
  const word={id,headword};const raw=JSON.parse(readFileSync(`data/lessons/${id}.json`,'utf8'));
  expect(validateLesson(raw,word).ok,headword).toBe(true);
  const result=read(word);expect(result.status,headword).toBe('ready');
  const sense=result.lesson?.senses.find(item=>item.title===title);expect(sense,headword).toBeDefined();
  expect(sense?.examples.length,headword).toBeGreaterThanOrEqual(1);
 }
});
