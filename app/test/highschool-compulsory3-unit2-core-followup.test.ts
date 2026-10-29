import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';

it('serves checked Unit 2 senses through the actual reader',()=>{
 const read=createLessonReader();
 for(const [id,headword,titles] of [[2395,'operation',['企业；经营活动']],[2396,'whisper',['传言；私下消息']],[2431,'tension',['紧张情绪；焦虑','紧张关系']],[2386,'retire',['退出比赛']]] as const){
  const word={id,headword},raw=JSON.parse(readFileSync(`data/lessons/${id}.json`,'utf8'));
  expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');
  for(const title of titles)expect(result.lesson?.senses.some(s=>s.title===title),`${headword}: ${title}`).toBe(true);
 }
});
it('resolves each Unit 2 stable key through seed mapping and actual reader',()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entries=catalog.entries.filter((entry:{memberships:{unitId:string|null}[]})=>entry.memberships.some(m=>m.unitId==='pep2019-compulsory-3:unit2'));
 const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
 try{const query=db.prepare('SELECT w.id,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id WHERE m.entry_key=?'),read=createLessonReader();
  expect(entries.length).toBeGreaterThan(90);
  for(const entry of entries){const word=query.get(entry.key) as {id:number;headword:string}|undefined;expect(word,entry.key).toBeDefined();const result=read(word!);expect(result.status,entry.key).toBe('ready');expect(validateLesson(result.lesson,word!).ok,entry.key).toBe(true);}
 }finally{db.close();}
});
