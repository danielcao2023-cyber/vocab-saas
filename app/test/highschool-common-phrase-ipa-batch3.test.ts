import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and serves sourced phrase IPA without inventing unverified accents',()=>{
 const rows=[
 [2004,'make progress','/meɪk ˈprəʊɡres/',''],
 [2010,'adapt to','/əˈdæpt tə/','/əˈdæpt tə/'],
 [2018,'make out','/meɪk aʊt/',''],
 [2043,'due to','/djuː tə/',''],
 [2053,'stir up','/stɜːr ˈʌp/',''],
 [2078,'go through','/ɡəʊ θruː/',''],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk,us] of rows){
  const word={id,headword};
  const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));
  expect(validateLesson(raw,word).ok,headword).toBe(true);
  const result=read(word);expect(result.status,headword).toBe('ready');
  expect(result.lesson?.pronunciation).toMatchObject({uk,us});
  expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');
 }
});
