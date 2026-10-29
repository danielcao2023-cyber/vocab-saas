import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';

it('serves checked Unit 3 senses through the actual reader',()=>{
 const read=createLessonReader();
 for(const [id,headword,titles] of [[2838,'buffet',['（风雨等）连续猛击']],[2893,'up to',['有能力胜任；身体能承受']]] as const){
  const word={id,headword},raw=JSON.parse(readFileSync(`data/lessons/${id}.json`,'utf8'));
  expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');
  for(const title of titles)expect(result.lesson?.senses.some(s=>s.title===title),`${headword}: ${title}`).toBe(true);
 }
});
it('resolves each Unit 3 stable key through seed mapping and actual reader',()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entries=catalog.entries.filter((entry:{memberships:{unitId:string|null}[]})=>entry.memberships.some(m=>m.unitId==='pep2019-optional-1:unit3'));
 const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
 try{const query=db.prepare('SELECT w.id,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id WHERE m.entry_key=?'),read=createLessonReader();
  expect(entries.length).toBeGreaterThan(60);
  for(const entry of entries){const word=query.get(entry.key) as {id:number;headword:string}|undefined;expect(word,entry.key).toBeDefined();const result=read(word!);expect(result.status,entry.key).toBe('ready');expect(validateLesson(result.lesson,word!).ok,entry.key).toBe(true);}
 }finally{db.close();}
});
